<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BotWaController;
use App\Http\Controllers\TelegramBotController;

Route::any('/bot-wa/webhook', [BotWaController::class, 'handle']);
Route::any('/bot-wa', [BotWaController::class, 'handle']);

// 🤖 KABEL UTAMA TELEGRAM BOT COMMAND CENTER
Route::any('/telegram/webhook', [TelegramBotController::class, 'webhook']);
