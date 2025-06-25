<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GalleryController extends Controller
{
    private function fetchMedia(?string $after = null, int $limit = 9)
    {
        $params = [
            'fields' => 'id,caption,media_url,permalink,thumbnail_url,media_type,children',
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

        $data = $response->json();

        foreach (($data['data'] ?? []) as &$item) {
            if (($item['media_type'] ?? '') === 'CAROUSEL_ALBUM' && isset($item['id'])) {
                $childRes = Http::get("https://graph.instagram.com/{$item['id']}/children", [
                    'fields' => 'id,media_type,media_url,thumbnail_url',
                    'access_token' => config('services.instagram.token'),
                ]);
                if ($childRes->ok()) {
                    $item['children'] = $childRes->json('data') ?? [];
                } else {
                    $item['children'] = [];
                }
            }
        }

        return $data;
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
        $result = $this->fetchMedia(null, $limit);

        return $result['data'] ?? [];
    }
}
