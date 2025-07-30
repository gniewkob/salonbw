<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceVariant;
use Illuminate\Http\Request;

class AdminServiceController extends Controller
{
    public function index()
    {
        $services = Service::withCount('variants')->orderBy('name')->get();
        return view('admin.services.index', compact('services'));
    }

    public function create()
    {
        return view('admin.services.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Service::create($validated);

        return redirect()->route('admin.services.index')->with('success', 'Usługa została dodana.');
    }

    public function edit(Service $service)
    {
        $service->load('variants');
        return view('admin.services.edit', compact('service'));
    }
    
    public function show(Service $service)
    {
        $service->load('variants');
        return view('admin.services.show', compact('service'));
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'variants' => 'array',
            'variants.*.id' => 'nullable|exists:service_variants,id',
            'variants.*.variant_name' => 'required_with:variants.*.duration_minutes,variants.*.price_pln|string|nullable',
            'variants.*.duration_minutes' => 'required_with:variants.*.variant_name|nullable|integer|min:1',
            'variants.*.price_pln' => 'required_with:variants.*.variant_name|nullable|integer|min:0',
            'variants.*._delete' => 'nullable|boolean',
        ]);

        $service->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (!empty($validated['variants'])) {
            foreach ($validated['variants'] as $variantData) {
                $delete = $variantData['_delete'] ?? false;

                if (!empty($variantData['id'])) {
                    $variant = ServiceVariant::find($variantData['id']);
                    if ($variant && $variant->service_id === $service->id) {
                        if ($delete) {
                            $variant->delete();
                            continue;
                        }
                        $variant->update([
                            'variant_name' => $variantData['variant_name'],
                            'duration_minutes' => $variantData['duration_minutes'],
                            'price_pln' => $variantData['price_pln'],
                        ]);
                    }
                } elseif (!$delete && !empty($variantData['variant_name'])) {
                    $service->variants()->create([
                        'variant_name' => $variantData['variant_name'],
                        'duration_minutes' => $variantData['duration_minutes'],
                        'price_pln' => $variantData['price_pln'],
                    ]);
                }
            }
        }

        return redirect()->route('admin.services.index')->with('success', 'Usługa i warianty zostały zaktualizowane.');
    }

    public function destroy(Service $service)
    {
        if ($service->variants()->whereHas('appointments')->exists()) {
            return back()->withErrors(['service' => 'Nie można usunąć usługi z rezerwacjami.']);
        }
        $service->delete();
        return redirect()->route('admin.services.index')->with('success', 'Usługa została usunięta.');
    }
}
