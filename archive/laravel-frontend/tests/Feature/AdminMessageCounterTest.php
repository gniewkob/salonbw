<?php
namespace Tests\Feature;

use App\Models\KontaktMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMessageCounterTest extends TestCase
{
    use RefreshDatabase;

    private function unreadCount(): int
    {
        return KontaktMessage::where('is_from_admin', false)
            ->whereNull('reply_to_id')
            ->where(function ($query) {
                $query->whereDoesntHave('replies', function ($q) {
                    $q->where('is_from_admin', true);
                })->orWhereHas('replies', function ($q) {
                    $q->where('is_from_admin', false)
                        ->where('is_read', false);
                });
            })->count();
    }

    public function test_counter_ignores_threads_waiting_for_user(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $message = KontaktMessage::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'message' => 'Hello',
            'is_from_admin' => false,
            'is_read' => false,
        ]);

        $this->assertSame(1, $this->unreadCount());

        KontaktMessage::create([
            'user_id' => $user->id,
            'admin_id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'message' => 'Reply',
            'reply_to_id' => $message->id,
            'is_from_admin' => true,
            'is_read' => false,
        ]);
        $message->update(['status' => KontaktMessage::STATUS_NEW_REPLY]);

        $this->assertSame(0, $this->unreadCount());

        KontaktMessage::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'message' => 'Thanks',
            'reply_to_id' => $message->id,
            'is_from_admin' => false,
            'is_read' => false,
        ]);
        $message->update(['status' => KontaktMessage::STATUS_NEW_REPLY]);

        $this->assertSame(1, $this->unreadCount());
    }
}
