<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $default = config('database.default');
        $sqliteDb = config('database.connections.sqlite.database');

        if ($default !== 'sqlite' || $sqliteDb !== ':memory:') {
            throw new \RuntimeException(
                "Refusing to run tests against non-memory database (default={$default}, sqlite={$sqliteDb})."
            );
        }
    }
}
