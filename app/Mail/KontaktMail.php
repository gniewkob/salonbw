<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class KontaktMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $senderName;
    public string $senderEmail;
    public string $senderPhone;
    public string $senderMessage;

    public function __construct(string $name, string $email, string $phone, string $message)
    {
        $this->senderName = $name;
        $this->senderEmail = $email;
        $this->senderPhone = $phone;
        $this->senderMessage = $message;
    }

    public function build()
    {
        return $this->subject('Nowa wiadomość ze strony')
            ->replyTo($this->senderEmail, $this->senderName)
            ->view('emails.kontakt')
            ->with([
                'senderName' => $this->senderName,
                'senderEmail' => $this->senderEmail,
                'senderPhone' => $this->senderPhone,
                'senderMessage' => $this->senderMessage,
            ]);
    }
}
