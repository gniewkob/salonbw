<?php

protected $routeMiddleware = [
	'auth' => \App\Http\Middleware\Authenticate::class,
	'is_admin' => \App\Http\Middleware\IsAdmin::class, // <--- TO DODAJ
	'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
	// inne...
];

