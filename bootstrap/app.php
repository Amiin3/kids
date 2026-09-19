<?php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\NasaFirewall::class);
        $middleware->trustProxies(at: '*');
        $middleware->append(\App\Http\Middleware\CheckMaintenanceMode::class);
        $middleware->web(append: [
            \App\Http\Middleware\PreventInertiaCaching::class,
        ]);
        
        $middleware->validateCsrfTokens(except: [
            'dashboard*',
            'api/webhook/android',
            'api/telegram/*',
            'api/bot-wa/*',
            'api/webhook/*',
            'api/callback/*',
            'hook-khfy',
            'webhook/*',
            'callback/*',
            'telegram/*',
            'telegram/management/*'
        ]);
        
        $middleware->redirectUsersTo(fn (Request $request) => route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, Request $request) {
            if ($request->header('X-Inertia')) {
                return Inertia::location($request->fullUrl());
            }
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['message' => 'CSRF token mismatch.'], 419);
            }
            return redirect()->route('login')->with('error', 'Sesi diperbarui.');
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->header('X-Inertia')) {
                return Inertia::location(url('/login'));
            }
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
