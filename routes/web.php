<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    KontaktController,
    AdminKontaktController,
    ProfileController,
    AppointmentController,
    AdminServiceController,
    FrontendServiceController,
    AdminAppointmentController,
    AdminUserController,
    ReservationEntryController
};

/*
|--------------------------------------------------------------------------
| Publiczne strony
|--------------------------------------------------------------------------
*/

Route::get('/', fn () => view('pages.home'))->name('home');

Route::get('/uslugi', function () {
    $services = \App\Models\Service::with('variants')->orderBy('name')->get();
    return view('pages.uslugi', compact('services'));
})->name('uslugi');

Route::view('/kontakt', 'pages.kontakt')->name('kontakt');
Route::post('/kontakt', [KontaktController::class, 'send'])->name('kontakt.wyslij');

/*
|--------------------------------------------------------------------------
| Autoryzowany użytkownik – Dashboard i profil
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn () => view('dashboard'))->name('dashboard');

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
    Route::get('/rezerwacje/dodaj', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/rezerwacje', [AppointmentController::class, 'store'])->name('appointments.store');

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
    // Usługi
    Route::get('/uslugi', [AdminServiceController::class, 'index'])->name('services.index');
    Route::get('/uslugi/nowa', [AdminServiceController::class, 'create'])->name('services.create');
    Route::post('/uslugi', [AdminServiceController::class, 'store'])->name('services.store');
    Route::get('/uslugi/{service}', [AdminServiceController::class, 'show'])->name('services.show');
    Route::get('/uslugi/{service}/edytuj', [AdminServiceController::class, 'edit'])->name('services.edit');
    Route::put('/uslugi/{service}', [AdminServiceController::class, 'update'])->name('services.update');
    Route::delete('/uslugi/{service}', [AdminServiceController::class, 'destroy'])->name('services.destroy');

    // Kontakt
    Route::get('/kontakt', [AdminKontaktController::class, 'edit'])->name('kontakt');

    // Rezerwacje i kalendarz
    Route::get('/rezerwacje', [AdminAppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/rezerwacje/{appointment}/edit', [AdminAppointmentController::class, 'edit'])->name('appointments.edit');
    Route::patch('/rezerwacje/{appointment}', [AdminAppointmentController::class, 'update'])->name('appointments.update');
    Route::get('/kalendarz', [AdminAppointmentController::class, 'calendar'])->name('calendar');
    Route::get('/kalendarz/api', [AdminAppointmentController::class, 'api'])->name('appointments.api');
    Route::put('/kalendarz/update/{appointment}', [AdminAppointmentController::class, 'updateAppointmentTime'])
    ->name('appointments.updateTime');
    Route::post('/admin/kalendarz/store', [AdminAppointmentController::class, 'store'])->name('appointments.store');
    Route::patch('/admin/kalendarz/{appointment}/cancel', [AdminAppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::patch('/admin/kalendarz/{appointment}/status', [AdminAppointmentController::class, 'updateStatus'])
    ->name('appointments.updateStatus');

    // 🔽 DODANE: API do dropdownów
    Route::get('/api/users', [AdminAppointmentController::class, 'users'])->name('appointments.users');
    Route::get('/api/variants', [AdminAppointmentController::class, 'variants'])->name('appointments.variants');
    });


    // Wiadomości
    Route::get('/wiadomosci', [AdminKontaktController::class, 'index'])->name('messages.index');
    Route::get('/wiadomosci/{id}', [AdminKontaktController::class, 'show'])->name('messages.show');
    Route::post('/wiadomosci/{id}/reply', [AdminKontaktController::class, 'reply'])->name('messages.reply');

    // Użytkownicy
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
});

/*
|--------------------------------------------------------------------------
| Rezerwacja publiczna (np. alias marketingowy)
|--------------------------------------------------------------------------
*/

Route::get('/zarezerwuj', [ReservationEntryController::class, 'index'])->name('reservation.entry');

require __DIR__ . '/auth.php';
