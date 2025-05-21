<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
	KontaktController,
	AdminKontaktController,
	ProfileController,
	AppointmentController,
	AdminServiceController,
	FrontendServiceController,
	AdminAppointmentController
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

Route::view('/zespol', 'pages.zespol')->name('zespol');
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
| Panel użytkownika – Rezerwacje
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
	Route::get('/moje-rezerwacje', [AppointmentController::class, 'index'])->name('appointments.index');
	Route::get('/rezerwacje/dodaj', [AppointmentController::class, 'create'])->name('appointments.create');
	Route::post('/rezerwacje', [AppointmentController::class, 'store'])->name('appointments.store');
});

/*
|--------------------------------------------------------------------------
| Panel administratora – Usługi i kontakt
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->prefix('admin')->group(function () {
	// Usługi
	Route::get('/uslugi', [AdminServiceController::class, 'index'])->name('admin.services.index');
	Route::get('/uslugi/nowa', [AdminServiceController::class, 'create'])->name('admin.services.create');
	Route::post('/uslugi', [AdminServiceController::class, 'store'])->name('admin.services.store');
	Route::get('/uslugi/{service}', [AdminServiceController::class, 'show'])->name('admin.services.show');
	Route::get('/uslugi/{service}/edytuj', [AdminServiceController::class, 'edit'])->name('admin.services.edit');
	Route::put('/uslugi/{service}', [AdminServiceController::class, 'update'])->name('admin.services.update');
	Route::delete('/uslugi/{service}', [AdminServiceController::class, 'destroy'])->name('admin.services.destroy');

	// Wiadomości
	Route::get('/kontakt', [AdminKontaktController::class, 'index'])->name('admin.kontakt');

	// Rezerwacje i kalendarz
	Route::get('/rezerwacje', [AdminAppointmentController::class, 'index'])->name('admin.appointments.index');
	Route::patch('/rezerwacje/{appointment}', [AdminAppointmentController::class, 'update'])->name('admin.appointments.update');

	Route::get('/kalendarz', [AdminAppointmentController::class, 'calendar'])->name('admin.calendar');
	Route::get('/kalendarz/api', [AdminAppointmentController::class, 'api'])->name('admin.appointments.api');
});

Route::middleware(['auth', 'is_admin'])->group(function() {
	// trasy admina
});

// Trasy dla panelu admina:
Route::middleware(['auth', 'is_admin'])->prefix('admin')->group(function() {
    Route::resource('appointments', App\Http\Controllers\AdminAppointmentController::class);
    // ...inne trasy admina
});

// Trasy dla użytkownika:
Route::middleware(['auth'])->group(function() {
    Route::get('/moje-wizyty', [App\Http\Controllers\AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/moje-wizyty/{id}', [App\Http\Controllers\AppointmentController::class, 'show'])->name('appointments.show');
    // ...inne trasy usera
});


/*
|--------------------------------------------------------------------------
| Tymczasowe zapytanie testowe
|--------------------------------------------------------------------------
*/

Route::get('/admin/test', fn () => \App\Models\KontaktMessage::count());

require __DIR__.'/auth.php';
