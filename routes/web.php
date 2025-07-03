<?php

use App\Http\Controllers\AdminAppointmentController;
use App\Http\Controllers\AdminKontaktController;
use App\Http\Controllers\AdminServiceController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminCouponController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminBlockerController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\KontaktController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservationEntryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GalleryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Strony publiczne
|--------------------------------------------------------------------------
*/
Route::get('/', function (GalleryController $gallery) {
    $instagramPhotos = $gallery->latest();
    $contactInfo = \App\Models\ContactInfo::getDefault();
    return view('pages.home', compact('instagramPhotos', 'contactInfo'));
})->name('home');

Route::get('/uslugi', function () {
    $services = \App\Models\Service::with('variants')->orderBy('name')->get();
    return view('pages.uslugi', compact('services'));
})->name('uslugi');

Route::get('/galeria', [GalleryController::class, 'index'])->name('gallery');
Route::view('/faq', 'pages.faq')->name('faq');

Route::get('/kontakt', [ContactController::class, 'show'])->name('kontakt');

Route::post('/kontakt', [KontaktController::class, 'store'])->name('kontakt.store');
Route::view('/polityka-prywatnosci', 'policy.privacy')->name('privacy');
Route::view('/polityka-cookies', 'policy.cookies')->name('cookies');
Route::view('/regulamin', 'policy.terms')->name('terms');
Route::view('/dane-kontaktowe', 'policy.contact')->name('policy.contact');
Route::view('/reklamacje', 'policy.complaints')->name('complaints');

/*
|--------------------------------------------------------------------------
| Panel użytkownika – Profil
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Panel użytkownika – Rezerwacje i wiadomości
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/moje-wizyty', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/moje-wizyty/{id}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::get('/kalendarz/moje-wizyty', [AppointmentController::class, 'calendar'])->name('appointments.calendar');
    Route::get('/kalendarz/moje-wizyty/api', [AppointmentController::class, 'calendarApi'])->name('appointments.calendar.api');
    Route::get('/rezerwacje/dodaj', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/rezerwacje', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::get('/rezerwacje/busy', [AppointmentController::class, 'busyTimes'])->name('appointments.busy');
    Route::patch('/appointments/{appointment}/confirm', [AppointmentController::class, 'confirm'])->name('appointments.confirm');
    Route::patch('/appointments/{appointment}/decline', [AppointmentController::class, 'decline'])->name('appointments.decline');
    Route::get('/moje-wiadomosci', [KontaktController::class, 'myMessages'])->name('messages.index');
    Route::get('/moje-wiadomosci/nowa', [KontaktController::class, 'create'])->name('messages.create');
    Route::post('/moje-wiadomosci', [KontaktController::class, 'store'])->name('messages.store');
    Route::get('/moje-wiadomosci/{id}', [KontaktController::class, 'show'])->name('messages.show');
    Route::post('/moje-wiadomosci/{id}/reply', [KontaktController::class, 'reply'])->name('messages.reply');
});

/*
|--------------------------------------------------------------------------
| Panel administratora – Usługi, wiadomości, kalendarz
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'is_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    // Usługi
    Route::get('/uslugi', [AdminServiceController::class, 'index'])->name('services.index');
    Route::get('/uslugi/nowa', [AdminServiceController::class, 'create'])->name('services.create');
    Route::post('/uslugi', [AdminServiceController::class, 'store'])->name('services.store');
    Route::get('/uslugi/{service}', [AdminServiceController::class, 'show'])->name('services.show');
    Route::get('/uslugi/{service}/edytuj', [AdminServiceController::class, 'edit'])->name('services.edit');
    Route::put('/uslugi/{service}', [AdminServiceController::class, 'update'])->name('services.update');
    Route::delete('/uslugi/{service}', [AdminServiceController::class, 'destroy'])->name('services.destroy');
    
    // Kontakt
    Route::get('/kontakt', [AdminKontaktController::class, 'edit'])->name('kontakt.edit');
    Route::put('/kontakt', [AdminKontaktController::class, 'update'])->name('kontakt.update');
    
    // Rezerwacje i kalendarz
    Route::get('/rezerwacje', [AdminAppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/rezerwacje/{appointment}/edit', [AdminAppointmentController::class, 'edit'])->name('appointments.edit');
    Route::patch('/rezerwacje/{appointment}', [AdminAppointmentController::class, 'update'])->name('appointments.update');
    Route::get('/kalendarz', [AdminAppointmentController::class, 'calendar'])->name('calendar');
    Route::get('/kalendarz/api', [AdminAppointmentController::class, 'api'])->name('appointments.api');
    Route::post('/kalendarz/appointments/{appointment}/update-time', [AdminAppointmentController::class, 'updateAppointmentTime'])->name('appointments.updateTime');
    Route::patch('/kalendarz/appointments/{appointment}', [AdminAppointmentController::class, 'update'])->name('appointments.updateFull');
    Route::delete('/kalendarz/appointments/{appointment}', [AdminAppointmentController::class, 'destroy'])->name('appointments.destroy');
    Route::post('/kalendarz/store', [AdminAppointmentController::class, 'store'])->name('appointments.store');
    Route::get('/kalendarz/appointments/{appointment}/history', [AdminAppointmentController::class, 'history'])->name('appointments.history');
    Route::patch('/kalendarz/appointments/{appointment}/finalize', [AdminAppointmentController::class, 'finalize'])->name('appointments.finalize');
    Route::patch('/kalendarz/{appointment}/cancel', [AdminAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::patch('/kalendarz/{appointment}/status', [AdminAppointmentController::class, 'updateStatus'])->name('appointments.updateStatus');
    Route::get('/kalendarz/{appointment}', [AdminAppointmentController::class, 'show'])->name('appointments.show');

    // Blokady
    Route::get('/blokady', [AdminBlockerController::class, 'calendar'])->name('blockers.calendar');
    Route::get('/blokady/api', [AdminBlockerController::class, 'api'])->name('blockers.api');
    
    // API do dropdownów i godzin pracy
    Route::get('/api/users', [AdminAppointmentController::class, 'users'])->name('appointments.users');
    Route::get('/api/variants', [AdminAppointmentController::class, 'variants'])->name('appointments.variants');
    Route::get('/api/services', [AdminAppointmentController::class, 'services'])->name('appointments.services');
    Route::get('/api/services/{service}/variants', [AdminAppointmentController::class, 'variantsForService'])->name('appointments.serviceVariants');
    Route::get('/api/working-hours', [AdminAppointmentController::class, 'workingHours'])->name('appointments.workingHours');
    
    // Wiadomości
    Route::get('/wiadomosci', [AdminKontaktController::class, 'index'])->name('messages.index');
    Route::get('/wiadomosci/{id}', [AdminKontaktController::class, 'show'])->name('messages.show');
    Route::post('/wiadomosci/{id}/reply', [AdminKontaktController::class, 'reply'])->name('messages.reply');
    
    // Użytkownicy
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');

    // Kupony
    Route::get('/kupony', [AdminCouponController::class, 'index'])->name('coupons.index');
    Route::get('/kupony/nowy', [AdminCouponController::class, 'create'])->name('coupons.create');
    Route::post('/kupony', [AdminCouponController::class, 'store'])->name('coupons.store');
    Route::get('/kupony/{coupon}/edytuj', [AdminCouponController::class, 'edit'])->name('coupons.edit');
    Route::put('/kupony/{coupon}', [AdminCouponController::class, 'update'])->name('coupons.update');
    Route::delete('/kupony/{coupon}', [AdminCouponController::class, 'destroy'])->name('coupons.destroy');
});

/*
|--------------------------------------------------------------------------
| Rezerwacja publiczna (np. alias marketingowy)
|--------------------------------------------------------------------------
*/
Route::get('/zarezerwuj', [ReservationEntryController::class, 'index'])->name('reservation.entry');

require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Fallback Route
|--------------------------------------------------------------------------
*/
Route::fallback(function () {
    if (auth()->check()) {
        return redirect()->route(
            auth()->user()->role === 'admin' ? 'admin.calendar' : 'dashboard'
        );
    }

    return response()->view('errors.404', [], 404);
});
