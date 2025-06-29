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
        $channel = \App\Notifications\Channels\WhatsAppChannel::class;
        return match ($notifiable->notification_preference) {
            'whatsapp' => [$channel],
            'both' => ['mail', $channel],
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
