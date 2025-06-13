import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

// Dodajemy logi debugowania
console.log('Calendar.js loaded - wersja z wymuszonym inicjowaniem');

// Funkcja inicjalizująca kalendarz
function initializeCalendar() {
  console.log('Inicjalizacja kalendarza rozpoczęta');
  
  const el = document.getElementById('calendar');
  console.log('Element kalendarza:', el);
  
  if (!el) {
    console.error('Element kalendarza nie został znaleziony! Sprawdź czy jesteś na właściwej stronie.');
    return;
  }
  
  const url = el.dataset.eventsUrl;
  console.log('URL wydarzeń:', url);
  
  if (!url) {
    console.error('Brak URL dla wydarzeń! Sprawdź atrybut data-events-url.');
    return;
  }
  
  // Flaga globalna – czy jakiś modal jest otwarty?
  window.modalIsOpen = false;
  
  // Godziny pracy salonu
  const workingHours = {
    start: '09:00', // Godzina otwarcia
    end: '18:00',   // Godzina zamknięcia
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Poniedziałek-Sobota (0=Niedziela, 1=Poniedziałek, itd.)
  };
  
  console.log('Inicjalizacja FullCalendar z pluginami');
  
  try {
    const calendar = new Calendar(el, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      locale: 'pl',
      allDaySlot: true,
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      snapDuration: '00:15:00',
      events: url,
      dateClick(info) {
        console.log('Kliknięto datę:', info);
        if (window.modalIsOpen) {
          console.log('Modal jest już otwarty, blokowanie kliknięcia');
          return; // blokada wielokrotnego otwierania
        }
        
        // Sprawdzenie czy kliknięta data/godzina jest w godzinach pracy
        if (!isWithinWorkingHours(info.date)) {
          showNotification('Nie można dodać rezerwacji poza godzinami pracy salonu.');
          return;
        }
        
        // Dodajemy klasę do body, aby zablokować interakcje z kalendarzem
        document.body.classList.add('modal-open');
        
        window.dispatchEvent(new CustomEvent('open-create-modal', { detail: info.dateStr }));
      },
      eventClick(info) {
        console.log('Kliknięto wydarzenie:', info);
        if (window.modalIsOpen) {
          console.log('Modal jest już otwarty, blokowanie kliknięcia');
          return; // blokada wielokrotnego otwierania
        }
        
        // Dodajemy klasę do body, aby zablokować interakcje z kalendarzem
        document.body.classList.add('modal-open');
        
        const data = { ...info.event.extendedProps, id: info.event.id };
        window.dispatchEvent(new CustomEvent('open-edit-modal', { detail: data }));
      },
      editable: true,
      eventDrop: function(info) {
        console.log('Przeciągnięto wydarzenie:', info);
        // Sprawdzenie czy modal jest otwarty
        if (window.modalIsOpen) {
          info.revert();
          return;
        }
        
        // Sprawdzenie czy nowy termin jest w godzinach pracy
        if (!isWithinWorkingHours(info.event.start)) {
          info.revert(); // Cofnij zmianę
          showNotification('Nie można przenieść rezerwacji poza godziny pracy salonu.');
          return;
        }
        
        // Potwierdzenie zmiany terminu
        if (!confirm('Czy na pewno chcesz zmienić termin rezerwacji?')) {
          info.revert();
          return;
        }
        
        // Aktualizacja terminu w bazie danych
        const appointmentId = info.event.id;
        const newDate = info.event.start.toISOString();
        
        fetch(`/admin/kalendarz/appointments/${appointmentId}/update-time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          body: JSON.stringify({
            appointment_at: newDate
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showNotification('Termin rezerwacji został zaktualizowany.');
          } else {
            info.revert();
            showNotification('Wystąpił błąd podczas aktualizacji terminu.');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          info.revert();
          showNotification('Wystąpił błąd podczas aktualizacji terminu.');
        });
      },
      eventResize: function(info) {
        console.log('Zmieniono rozmiar wydarzenia:', info);
        // Sprawdzenie czy modal jest otwarty
        if (window.modalIsOpen) {
          info.revert();
          return;
        }
        
        // Podobna logika jak przy eventDrop
        if (!isWithinWorkingHours(info.event.end)) {
          info.revert();
          showNotification('Rezerwacja nie może wykraczać poza godziny pracy salonu.');
          return;
        }
        
        // Tutaj można dodać kod do aktualizacji czasu trwania rezerwacji
        // Obecnie nie implementujemy tej funkcjonalności
        info.revert(); // Na razie blokujemy zmianę długości rezerwacji
        showNotification('Zmiana długości rezerwacji nie jest obecnie obsługiwana.');
      },
      businessHours: workingHours,
      slotMinTime: workingHours.start,
      slotMaxTime: workingHours.end,
      // Dodajemy wyraźne oznaczenie wizualne dla godzin pracy
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      // Dodajemy wyraźne style dla wydarzeń, aby były łatwiejsze do przeciągania
      eventDidMount: function(info) {
        // Dodajemy kursor wskazujący, że element można przeciągnąć
        info.el.style.cursor = 'move';
        // Dodajemy efekt hover
        info.el.addEventListener('mouseover', function() {
          if (!window.modalIsOpen) {
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            this.style.transform = 'scale(1.02)';
          }
        });
        info.el.addEventListener('mouseout', function() {
          this.style.boxShadow = 'none';
          this.style.transform = 'scale(1)';
        });
      }
    });
    
    console.log('Renderowanie kalendarza');
    calendar.render();
    console.log('Kalendarz wyrenderowany');
    
    // Zapisujemy instancję kalendarza do elementu DOM dla łatwiejszego debugowania
    el._fullCalendar = calendar;
    
    // Dodajemy wizualną wskazówkę, że kalendarz jest gotowy
    el.classList.add('calendar-initialized');
    
    // Dodajemy informację o możliwości przeciągania
    const infoElement = document.createElement('div');
    infoElement.className = 'drag-drop-info';
    infoElement.innerHTML = '<i class="fas fa-info-circle"></i> Możesz przeciągać wydarzenia, aby zmienić termin rezerwacji.';
    infoElement.style.padding = '10px';
    infoElement.style.margin = '10px 0';
    infoElement.style.backgroundColor = '#e9f7fe';
    infoElement.style.borderRadius = '4px';
    infoElement.style.color = '#3498db';
    infoElement.style.textAlign = 'center';
    
    // Wstawiamy informację przed kalendarzem
    el.parentNode.insertBefore(infoElement, el);
    
    // Nasłuchujemy na zdarzenie zamknięcia modala, aby usunąć klasę modal-open
    window.addEventListener('close-modal', function() {
      document.body.classList.remove('modal-open');
    });
    
    return calendar;
  } catch (error) {
    console.error('Błąd podczas inicjalizacji kalendarza:', error);
    showNotification('Wystąpił błąd podczas inicjalizacji kalendarza. Odśwież stronę.');
    return null;
  }
  
  // Funkcja sprawdzająca czy data jest w godzinach pracy
  function isWithinWorkingHours(date) {
    const day = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // Sprawdź czy dzień tygodnia jest dniem roboczym
    if (!workingHours.daysOfWeek.includes(day)) {
      return false;
    }
    
    // Parsuj godziny pracy
    const startHour = parseInt(workingHours.start.split(':')[0]);
    const startMinute = parseInt(workingHours.start.split(':')[1]);
    const endHour = parseInt(workingHours.end.split(':')[0]);
    const endMinute = parseInt(workingHours.end.split(':')[1]);
    
    // Sprawdź czy godzina jest w zakresie godzin pracy
    if (hour < startHour || (hour === startHour && minute < startMinute)) {
      return false;
    }
    
    if (hour > endHour || (hour === endHour && minute > endMinute)) {
      return false;
    }
    
    return true;
  }
  
  // Funkcja wyświetlająca powiadomienie
  function showNotification(message) {
    console.log('Powiadomienie:', message);
    // Sprawdź czy element powiadomienia już istnieje
    let notification = document.getElementById('calendar-notification');
    
    // Jeśli nie, utwórz go
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'calendar-notification';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      notification.style.zIndex = '9999';
      notification.style.transition = 'opacity 0.5s';
      document.body.appendChild(notification);
    }
    
    // Ustaw treść i pokaż powiadomienie
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Ukryj po 3 sekundach
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }
}

// Standardowa inicjalizacja przy załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  initializeCalendar();
  
  // Dodajemy nasłuchiwanie na zdarzenie zamknięcia modala
  window.addEventListener('close-modal', function() {
    console.log('Modal zamknięty, usuwanie klasy modal-open');
    document.body.classList.remove('modal-open');
    window.modalIsOpen = false;
  });
});

// Dodatkowa inicjalizacja z opóźnieniem, aby upewnić się, że strona jest w pełni załadowana
window.addEventListener('load', function() {
  console.log('Window load event fired');
  setTimeout(function() {
    // Sprawdź, czy kalendarz został już zainicjalizowany
    const el = document.getElementById('calendar');
    if (el && !el._fullCalendar) {
      console.log('Kalendarz nie został zainicjalizowany podczas DOMContentLoaded, próbuję ponownie');
      initializeCalendar();
    }
  }, 500);
});

// Natychmiastowa inicjalizacja, jeśli dokument jest już załadowany
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already loaded, initializing calendar immediately');
  setTimeout(function() {
    initializeCalendar();
  }, 100);
}

// Dodajemy funkcję globalną do ręcznego inicjowania kalendarza
window.initCalendar = function() {
  console.log('Manual calendar initialization triggered');
  return initializeCalendar();
};

// Dodajemy przycisk do ręcznego inicjowania kalendarza po 2 sekundach
setTimeout(function() {
  const el = document.getElementById('calendar');
  if (el && !el._fullCalendar) {
    console.log('Dodaję przycisk do ręcznego inicjowania kalendarza');
    const button = document.createElement('button');
    button.textContent = 'Inicjuj kalendarz';
    button.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4';
    button.onclick = function() {
      window.initCalendar();
      this.remove();
    };
    el.parentNode.insertBefore(button, el);
  }
}, 2000);

// Eksportujemy funkcję inicjalizującą
export { initializeCalendar };
