<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

use Tests\CreatesApplication;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Disable Vite during tests to avoid missing manifest errors
        $this->withoutVite();
    }
}
