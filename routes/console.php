<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pendaftaran Command Khfy War Engine via Class Command
Artisan::command('war:khfy-run', function () {
    $this->call(\App\Console\Commands\KhfyWarRunner::class);
});
