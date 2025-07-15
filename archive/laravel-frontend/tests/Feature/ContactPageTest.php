<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ContactPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_page_returns_successful_response(): void
    {
        Http::fake();

        $response = $this->get('/kontakt');

        $response->assertOk();
    }
}
