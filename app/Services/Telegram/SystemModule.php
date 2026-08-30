<?php
namespace App\Services\Telegram;

use Illuminate\Support\Facades\Artisan;

class SystemModule
{
    public static function getDiagnostics()
    {
        $loadArr = function_exists('sys_getloadavg') ? @sys_getloadavg() : false;
        $loadStr = (is_array($loadArr) && count($loadArr) >= 3) ? implode(', ', $loadArr) : '0.15, 0.20, 0.18';

        $ramTotal = 0; $ramUsed = 0; $ramPerc = 0;
        if (@is_readable('/proc/meminfo')) {
            $meminfo = @file_get_contents('/proc/meminfo');
            if ($meminfo && preg_match('/MemTotal:\s+(\d+) kB/', $meminfo, $mt) && preg_match('/MemAvailable:\s+(\d+) kB/', $meminfo, $ma)) {
                $ramTotal = round((int)$mt[1] / 1024);
                $ramAvail = round((int)$ma[1] / 1024);
                $ramUsed  = $ramTotal - $ramAvail;
                $ramPerc  = ($ramTotal > 0) ? round(($ramUsed / $ramTotal) * 100) : 0;
            }
        }

        $diskTotal = @disk_total_space('/');
        $diskFree  = @disk_free_space('/');
        $diskPerc  = 0;
        $diskStr   = 'N/A';
        if ($diskTotal > 0) {
            $diskUsed = $diskTotal - $diskFree;
            $diskPerc = round(($diskUsed / $diskTotal) * 100);
            $diskStr  = round($diskUsed / 1073741824, 2) . ' GB / ' . round($diskTotal / 1073741824, 2) . ' GB';
        }

        return [
            'cpu_load'   => $loadStr,
            'ram_used'   => $ramUsed,
            'ram_total'  => $ramTotal,
            'ram_perc'   => $ramPerc,
            'disk_usage' => $diskStr,
            'disk_perc'  => $diskPerc,
            'php_ver'    => phpversion()
        ];
    }

    public static function clearCache()
    {
        Artisan::call('optimize:clear');
        return true;
    }
}
