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
        $whatsAppChannel = \App\Notifications\Channels\WhatsAppChannel::class;

        $sendWhatsApp = in_array($notifiable->notification_preference, ['whatsapp', 'both']);

        if (property_exists($notifiable, 'whatsapp_opt_in')) {
            $sendWhatsApp = $sendWhatsApp && (bool) $notifiable->whatsapp_opt_in;
        }

        return match ($notifiable->notification_preference) {
            'whatsapp' => $sendWhatsApp ? [$whatsAppChannel] : ['mail'],
            'both' => $sendWhatsApp ? ['mail', $whatsAppChannel] : ['mail'],
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
        return [
            'to' => $notifiable->phone,
            'body' => 'Otrzymałeś nową wiadomość od salonu.',
        ];
    }
}
