<?php

namespace Tests\Feature;

use App\Models\KontaktMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageHighlightTest extends TestCase
{
    use RefreshDatabase;

    private function createThreadWithAdminReply(bool $replyRead = false): KontaktMessage
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(["role" => "admin"]);

        $message = KontaktMessage::create([
            "user_id"       => $user->id,
            "name"          => $user->name,
            "email"         => $user->email,
            "message"       => "Initial from user",
            "reply_to_id"   => null,
            "is_from_admin" => false,
            "is_read"       => true,
        ]);

        KontaktMessage::create([
            "user_id"       => $user->id,
            "admin_id"      => $admin->id,
            "name"          => $admin->name,
            "email"         => $admin->email,
            "message"       => "Reply from admin",
            "reply_to_id"   => $message->id,
            "is_from_admin" => true,
            "is_read"       => $replyRead,
        ]);

        return $message;
    }

    public function test_unread_admin_reply_highlights_red(): void
    {
        $message = $this->createThreadWithAdminReply(false);
        $user = $message->user;

        $response = $this->actingAs($user)->get(route("messages.index", absolute: false));
        $response->assertOk();
        $response->assertSee("hover:bg-gray-50 text-red-600");
    }

    public function test_highlight_removed_after_reading(): void
    {
        $message = $this->createThreadWithAdminReply(false);
        $user = $message->user;

        $this->actingAs($user)->get(route("messages.show", $message->id, absolute: false));

        $response = $this->actingAs($user)->get(route("messages.index", absolute: false));
        $response->assertOk();
        $response->assertDontSee("hover:bg-gray-50 text-red-600");
    }

    public function test_no_admin_reply_highlights_orange(): void
    {
        $user = User::factory()->create();

        KontaktMessage::create([
            "user_id"       => $user->id,
            "name"          => $user->name,
            "email"         => $user->email,
            "message"       => "Waiting for reply",
            "reply_to_id"   => null,
            "is_from_admin" => false,
        ]);

        $response = $this->actingAs($user)->get(route("messages.index", absolute: false));
        $response->assertOk();
        $response->assertSee("text-orange-600");
    }
}
