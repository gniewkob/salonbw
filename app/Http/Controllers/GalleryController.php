<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GalleryController extends Controller
{
    private function fetchMedia(?string $after = null, int $limit = 9)
    {
        $params = [
            'fields' => 'id,caption,media_url,permalink,thumbnail_url',
            'access_token' => config('services.instagram.token'),
            'limit' => $limit,
        ];
        if ($after) {
            $params['after'] = $after;
        }

        $response = Http::get('https://graph.instagram.com/me/media', $params);

        if ($response->failed()) {
            return ['data' => [], 'paging' => []];
        }

        return $response->json();
    }

    public function index(Request $request)
    {
        $after = $request->query('after');
        $result = $this->fetchMedia($after);

        if ($request->expectsJson()) {
            return $result;
        }

        return view('pages.gallery', [
            'media' => $result['data'] ?? [],
            'next' => $result['paging']['cursors']['after'] ?? null,
        ]);
    }

    public function latest(int $limit = 6)
    {
        return $this->fetchMedia(null, $limit)['data'] ?? [];
    }
}
