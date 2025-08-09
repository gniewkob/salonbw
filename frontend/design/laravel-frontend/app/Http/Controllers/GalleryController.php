<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GalleryController extends Controller
{
    private function fetchMedia(?string $after = null, int $limit = 9)
    {
        $params = [
            'fields' => 'id,caption,media_url,permalink,thumbnail_url,media_type',
            'access_token' => config('services.instagram.token'),
            'limit' => $limit,
        ];
        if ($after) {
            $params['after'] = $after;
        }

        $response = Http::get('https://graph.instagram.com/me/media', $params);

        if ($response->failed()) {
            Log::error('Failed to fetch Instagram media', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $data = $response->json();


        return $data;
    }

    public function index(Request $request)
    {
        $after = $request->query('after');
        $result = $this->fetchMedia($after) ?? ['data' => [], 'paging' => []];

        if ($request->expectsJson()) {
            return $result;
        }

        return view('pages.gallery', [
            'media' => $result['data'],
            'next' => $result['paging']['cursors']['after'] ?? null,
        ]);
    }

    public function latest(int $limit = 6)
    {
        $result = $this->fetchMedia(null, $limit) ?? ['data' => []];

        return $result['data'];
    }
}
