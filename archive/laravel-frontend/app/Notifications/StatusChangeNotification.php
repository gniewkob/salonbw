<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StatusChangeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private Appointment $appointment)
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
        return (new MailMessage)
            ->subject('Aktualizacja statusu rezerwacji')
            ->line('Status Twojej rezerwacji został zmieniony na: ' . $this->appointment->status)
            ->action('Zobacz szczegóły', url(route('appointments.show', $this->appointment->id)))
            ->line('Dziękujemy za korzystanie z naszych usług!');
    }

    public function toWhatsApp(object $notifiable): array
    {
        $clientName = $notifiable->name;
        $dateTime = $this->appointment->appointment_at->format('d.m.Y H:i');
        $serviceOrSalon = $this->appointment->service->name ?? config('app.name');

        return [
            'template_name' => 'status_zmiany_wizyty',
            'parameters' => [$clientName, $dateTime, $serviceOrSalon],
            'to' => $notifiable->phone,
        ];
    }
}
