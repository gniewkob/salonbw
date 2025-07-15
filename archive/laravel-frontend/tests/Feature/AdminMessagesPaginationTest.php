<?php

namespace Tests\Feature;

use App\Models\KontaktMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMessagesPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_paginates_messages(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();

        for ($i = 0; $i < 25; $i++) {
            KontaktMessage::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'message' => 'Test ' . $i,
                'is_from_admin' => false,
                'is_read' => false,
            ]);
        }

        $response = $this->actingAs($admin)
            ->get(route('admin.messages.index', absolute: false));

        $response->assertOk();
        $messages = $response->viewData('messages');
        $this->assertInstanceOf(\Illuminate\Pagination\LengthAwarePaginator::class, $messages);
        $this->assertCount(20, $messages);

        $responsePage2 = $this->actingAs($admin)
            ->get(route('admin.messages.index', ['page' => 2], absolute: false));

        $responsePage2->assertOk();
        $messagesPage2 = $responsePage2->viewData('messages');
        $this->assertCount(5, $messagesPage2);
    }
}
