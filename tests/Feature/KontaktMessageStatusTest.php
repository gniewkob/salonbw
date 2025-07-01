<?php

namespace Tests\Feature;

use App\Models\KontaktMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KontaktMessageStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_transitions_on_send_read_and_reply(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user)->post(route('messages.store', absolute: false), [
            'message' => 'Hello',
            'category' => '',
            'phone' => '',
        ]);

        $message = KontaktMessage::first();
        $this->assertSame(KontaktMessage::STATUS_SENT, $message->status);

        $this->actingAs($admin)->get(route('admin.messages.show', $message->id, absolute: false));
        $this->assertSame(KontaktMessage::STATUS_READ, $message->fresh()->status);

        $this->actingAs($admin)->post(route('admin.messages.reply', $message->id, absolute: false), [
            'message' => 'Reply',
        ]);
        $this->assertSame(KontaktMessage::STATUS_NEW_REPLY, $message->fresh()->status);

        $this->actingAs($user)->get(route('messages.show', $message->id, absolute: false));
        $this->assertSame(KontaktMessage::STATUS_READ, $message->fresh()->status);

        $this->actingAs($user)->post(route('messages.reply', $message->id, absolute: false), [
            'message' => 'Back at you',
        ]);
        $this->assertSame(KontaktMessage::STATUS_NEW_REPLY, $message->fresh()->status);
    }
}
