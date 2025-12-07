<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        User::create([
            'name' => 'Guilherme',
            'email' => 'luz@gmail.com',
            'password' => Hash::make('123456'), 
            'birth_date' => '2007-02-22',
            'account_status' => '1',
            'is_admin' => '1',  
        ]);

        User::create([
            'name' => 'Marcus',
            'email' => 'marcus@gmail.com',
            'password' => Hash::make('123456'),
            'birth_date' => '2006-12-16',
            'account_status' => '1',
            'is_admin' => '0',
        ]);
    }
}