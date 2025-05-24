import { Calendar } from '@fullcalendar/core';
import dayGridPlugin     from '@fullcalendar/daygrid';
import timeGridPlugin    from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin        from '@fullcalendar/list';

document.addEventListener('DOMContentLoaded', () => {
  const el  = document.getElementById('calendar');
  const url = el.dataset.eventsUrl;
  
  // Flaga globalna – czy jakiś modal jest otwarty?
  window.modalIsOpen = false;
  
  // Godziny pracy salonu
  const workingHours = {
    start: '09:00', // Godzina otwarcia
    end: '18:00',   // Godzina zamknięcia
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Poniedziałek-Sobota (0=Niedziela, 1=Poniedziałek, itd.)
  };
  
  const calendar = new Calendar(el, {
    plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin ],
    initialView: 'timeGridWeek',
    locale: 'pl',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: url,
    dateClick(info) {
      if (window.modalIsOpen) return; // blokada wielokrotnego otwierania
      
      // Sprawdzenie czy kliknięta data/godzina jest w godzinach pracy
      if (!isWithinWorkingHours(info.date)) {
        showNotification('Nie można dodać rezerwacji poza godzinami pracy salonu.');
        return;
      }
      
      window.dispatchEvent(new CustomEvent('open-create-modal', { detail: info.dateStr }));
    },
    eventClick(info) {
      if (window.modalIsOpen) return; // blokada wielokrotnego otwierania
      window.dispatchEvent(new CustomEvent('open-view-modal', { detail: info.event.extendedProps }));
    },
    editable: true,
    eventDrop: function(info) {
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
  });
  
  calendar.render();
  
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
});
