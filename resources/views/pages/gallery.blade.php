<x-guest-layout>
    <div class="max-w-7xl mx-auto py-20 px-4">
        <h1 class="text-3xl font-bold text-center mb-8">Galeria</h1>
        <div id="gallery" class="grid grid-cols-2 md:grid-cols-3 gap-4">
            @foreach($media as $item)
                <a href="{{ $item['permalink'] }}" target="_blank">
                    <img src="{{ $item['media_url'] }}" alt="{{ $item['caption'] ?? '' }}" class="w-full h-60 object-cover rounded" loading="lazy">
                </a>
            @endforeach
        </div>
        <div id="sentinel" class="h-1"></div>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                let next = @json($next);
                const gallery = document.getElementById('gallery');
                const sentinel = document.getElementById('sentinel');

                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver(entries => {
                        if (entries[0].isIntersecting && next) {
                            fetch(`{{ route('gallery') }}?after=${encodeURIComponent(next)}`, { headers: { 'Accept': 'application/json' }})
                                .then(r => r.json())
                                .then(res => {
                                    next = res.paging?.cursors?.after;
                                    (res.data || []).forEach(item => {
                                        const a = document.createElement('a');
                                        a.href = item.permalink;
                                        a.target = '_blank';
                                        const img = document.createElement('img');
                                        img.src = item.media_url;
                                        img.alt = item.caption || '';
                                        img.className = 'w-full h-60 object-cover rounded';
                                        img.loading = 'lazy';
                                        a.appendChild(img);
                                        gallery.appendChild(a);
                                    });
                                });
                        }
                    });

                    observer.observe(sentinel);
                }
            });
        </script>
    @endpush
</x-guest-layout>
