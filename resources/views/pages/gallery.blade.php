<x-guest-layout>
    <div class="max-w-7xl mx-auto py-20 px-4">
        <h1 class="text-3xl font-bold text-center mb-8">Galeria</h1>
        <div id="gallery" class="grid grid-cols-2 md:grid-cols-3 gap-4">
            @foreach($media as $item)
                <a href="{{ $item['permalink'] }}" target="_blank">
                    @if(($item['media_type'] ?? '') === 'VIDEO')
                        <video autoplay muted loop playsinline class="w-full h-60 object-cover rounded" preload="none">
                            <source src="{{ $item['media_url'] ?? '' }}" type="video/mp4">
                            <img src="{{ $item['thumbnail_url'] ?? '' }}" alt="{{ $item['caption'] ?? '' }}" class="w-full h-60 object-cover rounded">
                        </video>
                    @else
                        <img src="{{ $item['media_url'] ?? '' }}" alt="{{ $item['caption'] ?? '' }}" class="w-full h-60 object-cover rounded" loading="lazy">
                    @endif
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
                                        if (item.media_type === 'VIDEO') {
                                            const video = document.createElement('video');
                                            video.controls = false;
                                            video.autoplay = true;
                                            video.muted = true;
                                            video.loop = true;
                                            video.playsInline = true;
                                            video.poster = item.thumbnail_url || '';
                                            video.className = 'w-full h-60 object-cover rounded';
                                            const source = document.createElement('source');
                                            source.src = item.media_url;
                                            source.type = 'video/mp4';
                                            video.appendChild(source);
                                            const imgFallback = document.createElement('img');
                                            imgFallback.src = item.thumbnail_url || '';
                                            imgFallback.alt = item.caption || '';
                                            imgFallback.className = 'w-full h-60 object-cover rounded';
                                            video.appendChild(imgFallback);
                                            a.appendChild(video);
                                            gallery.appendChild(a);
                                        } else {
                                            const img = document.createElement('img');
                                            img.src = item.media_url;
                                            img.alt = item.caption || '';
                                            img.className = 'w-full h-60 object-cover rounded';
                                            img.loading = 'lazy';
                                            a.appendChild(img);
                                            gallery.appendChild(a);
                                        }
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
