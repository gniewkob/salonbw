<x-guest-layout>
    <div class="max-w-7xl mx-auto py-20 px-4">
        <h1 class="text-3xl font-bold text-center mb-8">Galeria</h1>
        <div id="gallery" class="grid grid-cols-2 md:grid-cols-3 gap-4">
            @foreach($media as $item)
                <a href="{{ $item['permalink'] }}" target="_blank">
                    @if(!empty($item['children']))
                        <div class="carousel-swiper swiper h-60">
                            <div class="swiper-wrapper">
                                @foreach($item['children'] as $child)
                                    <div class="swiper-slide">
                                        @if(($child['media_type'] ?? '') === 'VIDEO')
                                            <video autoplay muted loop playsinline class="w-full h-60 object-cover rounded" preload="none">
                                                <source src="{{ $child['media_url'] }}" type="video/mp4">
                                                <img src="{{ $child['thumbnail_url'] ?? '' }}" alt="" class="w-full h-60 object-cover rounded">
                                            </video>
                                        @else
                                            <img src="{{ $child['media_url'] }}" alt="" class="w-full h-60 object-cover rounded" loading="lazy">
                                        @endif
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @elseif(($item['media_type'] ?? '') === 'VIDEO')
                        <video autoplay muted loop playsinline class="w-full h-60 object-cover rounded" preload="none">
                            <source src="{{ $item['media_url'] }}" type="video/mp4">
                            <img src="{{ $item['thumbnail_url'] ?? '' }}" alt="{{ $item['caption'] ?? '' }}" class="w-full h-60 object-cover rounded">
                        </video>
                    @else
                        <img src="{{ $item['media_url'] }}" alt="{{ $item['caption'] ?? '' }}" class="w-full h-60 object-cover rounded" loading="lazy">
                    @endif
                </a>
            @endforeach
        </div>
        <div id="sentinel" class="h-1"></div>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                function initCarousel(el) {
                    new Swiper(el, {
                        loop: true,
                        autoplay: { delay: 3000 },
                    });
                }

                document.querySelectorAll('.carousel-swiper').forEach(initCarousel);

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
                                        if (Array.isArray(item.children) && item.children.length) {
                                            const swiper = document.createElement('div');
                                            swiper.className = 'carousel-swiper swiper h-60';
                                            const wrapper = document.createElement('div');
                                            wrapper.className = 'swiper-wrapper';
                                            item.children.forEach(child => {
                                                const slide = document.createElement('div');
                                                slide.className = 'swiper-slide';
                                                if (child.media_type === 'VIDEO') {
                                                    const video = document.createElement('video');
                                                    video.controls = false;
                                                    video.autoplay = true;
                                                    video.muted = true;
                                                    video.loop = true;
                                                    video.playsInline = true;
                                                    video.poster = child.thumbnail_url || '';
                                                    video.className = 'w-full h-60 object-cover rounded';
                                                    const source = document.createElement('source');
                                                    source.src = child.media_url;
                                                    source.type = 'video/mp4';
                                                    video.appendChild(source);
                                                    const imgFallback = document.createElement('img');
                                                    imgFallback.src = child.thumbnail_url || '';
                                                    imgFallback.alt = '';
                                                    imgFallback.className = 'w-full h-60 object-cover rounded';
                                                    video.appendChild(imgFallback);
                                                    slide.appendChild(video);
                                                } else {
                                                    const img = document.createElement('img');
                                                    img.src = child.media_url;
                                                    img.alt = '';
                                                    img.className = 'w-full h-60 object-cover rounded';
                                                    img.loading = 'lazy';
                                                    slide.appendChild(img);
                                                }
                                                wrapper.appendChild(slide);
                                            });
                                            swiper.appendChild(wrapper);
                                            a.appendChild(swiper);
                                            gallery.appendChild(a);
                                            initCarousel(swiper);
                                        } else if (item.media_type === 'VIDEO') {
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
