<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TipoPerfilSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Array com os tipos de perfil na ordem solicitada
        $tipos = [
            'Infantil',
            'Juvenil',
            'Adulto',
        ];

        $now = Carbon::now();
        $dataToInsert = [];

        // 2. Prepara os dados para inserção em massa
        foreach ($tipos as $tipo) {
            $dataToInsert[] = [
                'nome_tipo_perfil' => $tipo,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Limpa a tabela (opcional, mas recomendado) e insere os novos dados
        DB::table('tipos_perfil')->truncate(); 
        DB::table('tipos_perfil')->insert($dataToInsert);
    }
}