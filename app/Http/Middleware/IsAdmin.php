<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        // Pastikan hanya user yang punya role 'admin' atau level 'admin' yang bisa lewat
        if (auth()->check() && (auth()->user()->role === 'admin' || auth()->user()->level === 'admin')) {
            return $next($request);
        }
        
        // JIKA BUKAN ADMIN: Pura-pura halamannya tidak ada (404) agar scanner bingung!
        abort(404);
    }
}
