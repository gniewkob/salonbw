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

Route::get('/', function () {
    return view('pages.home');
})->name('home');

Route::get('/uslugi', function () {
    $services = \App\Models\Service::with('variants')->orderBy('name')->get();
    return view('pages.uslugi', compact('services'));
})->name('uslugi');

Route::view('/kontakt', 'pages.kontakt')->name('kontakt');
Route::post('/kontakt', [KontaktController::class, 'send'])->name('kontakt.wyslij');

/*
|--------------------------------------------------------------------------
| Flow rezerwacji — pośredni wybór logowania/rejestracji
|--------------------------------------------------------------------------
*/

Route::get('/zarezerwuj', [ReservationEntryController::class, 'index'])->name('reservation.entry');

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
| Panel użytkownika – Rezerwacje (moje wizyty)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/moje-wizyty', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/moje-wizyty/{id}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::get('/rezerwacje/dodaj', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/rezerwacje', [AppointmentController::class, 'store'])->name('appointments.store');
});

/*
|--------------------------------------------------------------------------
| Panel administratora – wszystkie funkcje
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

    // Wiadomości kontaktowe
    Route::get('/kontakt', [AdminKontaktController::class, 'index'])->name('kontakt');

    // Rezerwacje/kalendarz - trasy niestandardowe
    Route::get('/rezerwacje', [AdminAppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/rezerwacje/{appointment}/edit', [AdminAppointmentController::class, 'edit'])->name('appointments.edit');
    Route::patch('/rezerwacje/{appointment}', [AdminAppointmentController::class, 'update'])->name('appointments.update');

    Route::get('/kalendarz', [AdminAppointmentController::class, 'calendar'])->name('calendar');
    Route::get('/kalendarz/api', [AdminAppointmentController::class, 'api'])->name('appointments.api');

    // Resource controller – dla masowej edycji (np. z blade, API)
    Route::resource('appointments', AdminAppointmentController::class)->except(['index', 'edit', 'update']);

    // Zarządzanie użytkownikami
    Route::resource('users', AdminUserController::class)->except(['create', 'store', 'destroy', 'show']);
});

/*
|--------------------------------------------------------------------------
| Auth Breeze/Fortify
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';
