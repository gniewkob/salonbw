<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PolicyPagesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @dataProvider policyRoutes
     */
    public function test_policy_pages_are_accessible(string $route): void
    {
        Http::fake();

        $response = $this->get($route);
        $response->assertStatus(200);
    }

    public static function policyRoutes(): array
    {
        return [
            ['/polityka-prywatnosci'],
            ['/polityka-cookies'],
            ['/regulamin'],
            ['/reklamacje'],
            ['/moje-zgody'],
        ];
    }
}

