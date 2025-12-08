<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AvatarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        
        $now = Carbon::now();

        // 1. Lista de nomes de arquivos fornecidos pelo usuário
        $nomes_de_arquivos = [
            'ana.png',
            'arthur.png',
            'cristina.png',
            'gaspar.png',
            'helena.png',
            'holly.png',
            'kaiser.png',
            'lirio.png',
        ];

        $avatares_para_inserir = [];

        // 2. Cria a estrutura de dados, usando o caminho relativo à raiz pública
        foreach ($nomes_de_arquivos as $nome) {
            $avatares_para_inserir[] = [
     
                'img_avatar' => "/avatares/{$nome}", 
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Limpa a tabela (opcional) e insere os dados
        DB::table('avatares')->truncate();
        DB::table('avatares')->insert($avatares_para_inserir);
    }
}