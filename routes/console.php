<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pasukan Penyapu Ranjau KHFY
use Illuminate\Support\Facades\Schedule;
Schedule::command('khfy:sweeper')->everyMinute()->withoutOverlapping();

// 🔥 JADWAL MESIN MUTASI BANK (TIAP MENIT) 🔥
        // Schedule::command('bank:seabank')->everyMinute()->withoutOverlapping();
        // Schedule::command('bank:jago')->everyMinute()->withoutOverlapping();
// Atau kalau lu pake Omni-Parser
        // Schedule::command('bank:parse')->everyMinute()->withoutOverlapping();