<?php

namespace App\Http\Controllers;

use App\Models\ContactInfo;

class ContactController extends Controller
{
    public function show()
    {
        $contactInfo = ContactInfo::getDefault();
        return view('kontakt', compact('contactInfo'));
    }
}
