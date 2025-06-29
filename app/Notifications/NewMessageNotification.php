<?php

namespace App\Notifications;

use App\Models\KontaktMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private KontaktMessage $message)
    {
    }

    public function via(object $notifiable): array
    {
        $channel = \App\Notifications\Channels\WhatsAppChannel::class;
        return match ($notifiable->notification_preference) {
            'whatsapp' => [$channel],
            'both' => ['mail', $channel],
            default => ['mail'],
        };
    }

    public function toMail(object $notifiable): MailMessage
    {
        $threadId = $this->message->reply_to_id ?: $this->message->id;

        return (new MailMessage)
            ->subject('Nowa wiadomość z salonu')
            ->line('Otrzymałeś nową wiadomość od salonu.')
            ->action('Zobacz wiadomość', url(route('messages.show', $threadId)))
            ->line('Pozdrawiamy!');
    }

    public function toWhatsApp(object $notifiable): array
    {
        $clientName = $notifiable->name;
        $salonName = config('app.name');

        return [
            'template_name' => 'nowa_wiadomosc',
            'parameters' => [$clientName, $salonName],
            'to' => $notifiable->phone,
        ];
    }
}
