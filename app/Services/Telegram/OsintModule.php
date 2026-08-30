<?php
namespace App\Services\Telegram;

use Illuminate\Support\Facades\Http;

class OsintModule
{
    public static function lookup($target)
    {
        $target = trim($target);
        if (empty($target)) return ['status' => 'error', 'message' => 'Target kosong'];

        // Cek IP
        if (filter_var($target, FILTER_VALIDATE_IP)) {
            try {
                $res = Http::timeout(5)->get("http://ip-api.com/json/{$target}?fields=status,message,country,regionName,city,isp,org,as,query");
                if ($res->successful() && $res['status'] === 'success') {
                    return ['status' => 'success', 'type' => 'ip', 'data' => $res->json()];
                }
            } catch (\Exception $e) {}
        }

        // Cek Nomor Handphone
        $cleanPhone = preg_replace('/[^0-9]/', '', $target);
        if (strlen($cleanPhone) >= 9) {
            $prefix = substr($cleanPhone, 0, 4);
            if (substr($prefix, 0, 2) == '62') $prefix = '0' . substr($cleanPhone, 2, 3);
            
            $provider = "Operator Tidak Dikenal";
            if (in_array($prefix, ['0811','0812','0813','0821','0822','0823','0852','0853','0851'])) $provider = "Telkomsel";
            else if (in_array($prefix, ['0814','0815','0816','0855','0856','0857','0858'])) $provider = "Indosat Ooredoo";
            else if (in_array($prefix, ['0817','0818','0819','0859','0877','0878'])) $provider = "XL Axiata";
            else if (in_array($prefix, ['0831','0832','0833','0838'])) $provider = "Axis";
            else if (in_array($prefix, ['0895','0896','0897','0898','0899'])) $provider = "Tri (3)";
            else if (in_array($prefix, ['0881','0882','0883','0884','0885','0886','0887','0888','0889'])) $provider = "Smartfren";

            return [
                'status' => 'success',
                'type'   => 'phone',
                'data'   => [
                    'number'   => $target,
                    'clean'    => $cleanPhone,
                    'provider' => $provider,
                    'country'  => (substr($cleanPhone, 0, 2) == '62' || substr($cleanPhone, 0, 2) == '08') ? 'Indonesia (+62)' : 'International',
                    'getcontact' => "https://web.getcontact.com/search?phone=" . $cleanPhone
                ]
            ];
        }

        return ['status' => 'error', 'message' => 'Format IP atau Nomor HP tidak valid'];
    }
}
