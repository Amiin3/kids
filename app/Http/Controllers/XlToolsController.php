<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class XlToolsController extends Controller
{
    public function index() {
        return Inertia::render('Tools/XlTools', [
            'userBalance' => DB::table('users')->where('id', auth()->id())->value('saldo') ?? 0
        ]);
    }
}
