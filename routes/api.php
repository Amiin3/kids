<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BotWaController;

Route::any('/bot-wa/webhook', [BotWaController::class, 'handle']);
Route::any('/bot-wa', [BotWaController::class, 'handle']);
