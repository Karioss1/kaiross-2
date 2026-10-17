import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  SafeAreaView, StatusBar, TextInput, Modal, Switch, 
  Alert, Platform, KeyboardAvoidingView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const STORAGE_KEY = '@kairos_events';

export default function App() {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const hoursList = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 17));
  const [selectedDay, setSelectedDay] = useState(17);
  const [currentView, setCurrentView] = useState('Mes');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDayPopupOpen, setIsDayPopupOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // ESTADOS DEL RELOJ / SELECCIÓN DE HORA
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start'); // 'start' o 'end'

  // CATEGORÍAS Y CALENDARIOS
  const [activeCalendars, setActiveCalendars] = useState([
    { id: '1', name: 'Personal', color: '#4285F4', active: true },
    { id: '2', name: 'Trabajo', color: '#EA4335', active: true },
    { id: '3', name: 'Festivos', color: '#2EA44F', active: true },
    { id: '4', name: 'Correo electrónico', color: '#1B66C9', active: true },
    { id: '5', name: 'Cumpleaños', color: '#FBBC05', active: true },
  ]);

  // FORMULARIO
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState('10 minutos antes');
  const [repetition, setRepetition] = useState('Evento único');
  const [participant, setParticipant] = useState('');
  const [availability, setAvailability] = useState('Ocupado');
  const [privacy, setPrivacy] = useState('Estándar');
  const [attachmentType, setAttachmentType] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('4');

  const [events, setEvents] = useState({});

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setEvents(JSON.parse(stored));
      } catch (e) {
        console.log('Error cargando eventos', e);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch (e) {
        console.log('Error guardando eventos', e);
      }
    };
    if (Object.keys(events).length > 0) saveEvents();
  }, [events]);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const currentMonthName = months[monthIndex];
  
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDayOffset = getFirstDayOfMonth(year, monthIndex);
  const monthKey = `${currentMonthName.toLowerCase()}-${year}`;
  const dateKey = `${monthKey}-${selectedDay}`;

  const getWeekNumber = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear();
  };

  const changeMonth = (offset) => {
    const newDate = new Date(year, monthIndex + offset, 1);
    setCurrentDate(newDate);
    setSelectedDay(1);
  };

  const toggleCalendarFilter = (id) => {
    setActiveCalendars(activeCalendars.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  const activeCategoryNames = activeCalendars.filter(c => c.active).map(c => c.name);
  const getDayEvents = (day) => {
    const key = `${monthKey}-${day}`;
    return (events[key] || []).filter(e => !e.category || activeCategoryNames.includes(e.category));
  };

  const currentEvents = getDayEvents(selectedDay);

  const openTimePicker = (type) => {
    setTimePickerType(type);
    setShowTimePickerModal(true);
  };

  const selectTimeOption = (timeStr) => {
    if (timePickerType === 'start') {
      setStartTime(timeStr);
    } else {
      setEndTime(timeStr);
    }
    setShowTimePickerModal(false);
  };

  const handleSaveEvent = () => {
    if (!title.trim()) {
      showAlert('Atención', 'Escribe un título para el evento.');
      return;
    }

    const category = activeCalendars.find(c => c.id === selectedCategoryId) || activeCalendars[0];

    const newEvent = {
      id: editingEventId || Date.now().toString(),
      title: title.trim(),
      category: category.name,
      color: category.color,
      startTime: isAllDay ? 'Todo el día' : startTime,
      endTime: isAllDay ? '' : endTime,
      location: location.trim(),
      description: description.trim(),
      reminder,
      repetition,
      participant,
      availability,
      privacy,
      file: attachmentType ? { name: 'Adjunto', type: attachmentType } : null
    };

    let updatedEvents = { ...events };
    
    if (editingEventId) {
      Object.keys(updatedEvents).forEach(key => {
        const idx = updatedEvents[key].findIndex(e => e.id === editingEventId);
        if (idx !== -1) {
          if (key !== dateKey) {
            updatedEvents[key] = updatedEvents[key].filter(e => e.id !== editingEventId);
            updatedEvents[dateKey] = [...(updatedEvents[dateKey] || []), newEvent];
          } else {
            updatedEvents[key][idx] = newEvent;
          }
        }
      });
      if (!updatedEvents[dateKey]?.find(e => e.id === editingEventId)) {
         updatedEvents[dateKey] = [...(updatedEvents[dateKey] || []), newEvent];
      }
    } else {
      const dayEvs = updatedEvents[dateKey] || [];
      updatedEvents[dateKey] = [...dayEvs, newEvent];
    }

    setEvents(updatedEvents);
    resetForm();
    setIsModalOpen(false);
    setIsDayPopupOpen(false);
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setStartTime('19:00');
    setEndTime('20:00');
    setReminder('10 minutos antes');
    setRepetition('Evento único');
    setParticipant('');
    setAvailability('Ocupado');
    setPrivacy('Estándar');
    setAttachmentType(null);
    setEditingEventId(null);
    setSelectedCategoryId('4');
    setIsAllDay(false);
  };

  const handleEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setStartTime(ev.startTime === 'Todo el día' ? '19:00' : ev.startTime);
    setEndTime(ev.endTime || '20:00');
    setIsAllDay(ev.startTime === 'Todo el día');
    setLocation(ev.location || '');
    setDescription(ev.description || '');
    setReminder(ev.reminder || '10 minutos antes');
    setRepetition(ev.repetition || 'Evento único');
    setParticipant(ev.participant || '');
    setAvailability(ev.availability || 'Ocupado');
    setPrivacy(ev.privacy || 'Estándar');
    setAttachmentType(ev.file?.type || null);
    const cat = activeCalendars.find(c => c.name === ev.category);
    if (cat) setSelectedCategoryId(cat.id);
    setIsDayPopupOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id) => {
    const doDelete = () => {
      let updatedEvents = { ...events };
      Object.keys(updatedEvents).forEach(key => {
        updatedEvents[key] = updatedEvents[key].filter(e => e.id !== id);
      });
      setEvents(updatedEvents);
      setIsDayPopupOpen(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Eliminar este evento?')) doDelete();
    } else {
      Alert.alert('Eliminar', '¿Seguro que quieres borrar este evento?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const handleDayPress = (day) => {
    setSelectedDay(day);
    setIsDayPopupOpen(true);
  };

  const handleDayLongPress = (day) => {
    setSelectedDay(day);
    resetForm();
    setIsModalOpen(true);
  };

  const renderCalendarGrid = () => {
    const cells = [];
    
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvs = getDayEvents(day);
      const isSelected = selectedDay === day;
      const isTodayDate = isToday(day);
      const cellDate = new Date(year, monthIndex, day);
      const weekNum = getWeekNumber(cellDate);
      const isMonday = cellDate.getDay() === 1;

      cells.push(
        <TouchableOpacity 
          key={day} 
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => handleDayPress(day)}
          onLongPress={() => handleDayLongPress(day)}
        >
          <View style={styles.dayNumberRow}>
            <View style={[styles.dayNumberWrapper, isTodayDate && styles.todayCircle]}>
              <Text style={[
                styles.dayNumber, 
                isSelected && styles.selectedDayNumber,
                isTodayDate && styles.todayText
              ]}>
                {day}
              </Text>
            </View>
            {isMonday && <Text style={styles.weekNumText}>{weekNum}</Text>}
          </View>

          {dayEvs.slice(0, 2).map((ev) => (
            <View key={ev.id} style={[styles.eventBadge, { backgroundColor: ev.color || '#4285F4' }]}>
              <Text style={styles.eventBadgeText} numberOfLines={1}>{ev.title}</Text>
            </View>
          ))}
          {dayEvs.length > 2 && (
            <Text style={styles.moreEventsText}>+{dayEvs.length - 2} más</Text>
          )}
        </TouchableOpacity>
      );
    }

    const totalCells = firstDayOffset + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(<View key={`end-${i}`} style={styles.dayCellEmpty} />);
      }
    }

    return cells;
  };

  const selectedCategory = activeCalendars.find(c => c.id === selectedCategoryId) || activeCalendars[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B66C9" />
      
      {/* BARRA SUPERIOR PRINCIPAL */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.topBarCenter}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.arrowIcon}>‹</Text></TouchableOpacity>
          <Text style={styles.topBarTitle}>Kairós 🗿 {currentMonthName} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.arrowIcon}>›</Text></TouchableOpacity>
        </View>

        <View style={styles.topBarIcons}>
          <TouchableOpacity onPress={() => {
            const now = new Date();
            setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelectedDay(now.getDate());
          }}>
            <Text style={styles.todayBtn}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}>
            <Text style={styles.topIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MENÚ OPCIONES */}
      {isOptionsMenuOpen && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity style={styles.optionItem} onPress={() => { setIsOptionsMenuOpen(false); showAlert('Ir a fecha', 'Selecciona fecha'); }}>
            <Text style={styles.optionText}>Ir a</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={() => { setIsOptionsMenuOpen(false); setIsSettingsOpen(true); }}>
            <Text style={styles.optionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CABECERA DÍAS */}
      <View style={styles.weekHeader}>
        {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d, i) => (
          <Text key={i} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>

      {/* CUADRÍCULA CALENDARIO */}
      <ScrollView style={styles.calendarBody}>
        <View style={styles.gridContainer}>
          {renderCalendarGrid()}
        </View>

        <View style={styles.agendaSection}>
          <Text style={styles.agendaSectionTitle}>Eventos del {selectedDay} de {currentMonthName}:</Text>
          {currentEvents.length === 0 ? (
            <Text style={styles.emptyAgendaText}>No hay eventos. Toca el botón + para crear uno.</Text>
          ) : (
            currentEvents.map((ev) => (
              <TouchableOpacity key={ev.id} style={styles.agendaCard} onPress={() => handleEditEvent(ev)}>
                <View style={[styles.agendaColorBar, { backgroundColor: ev.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.agendaCardTitle}>{ev.title}</Text>
                  <Text style={styles.agendaCardSub}>⏰ {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</Text>
                  {ev.location ? <Text style={styles.agendaCardLoc}>📍 {ev.location}</Text> : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* POPUP DÍA */}
      <Modal visible={isDayPopupOpen} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={() => setIsDayPopupOpen(false)}>
          <View style={styles.dayPopupWindow}>
            <View style={styles.popupHeaderRow}>
              <Text style={styles.popupEventsCount}>{currentEvents.length} EVENTOS</Text>
              <TouchableOpacity style={styles.popupIconBtn} onPress={() => { setIsDayPopupOpen(false); resetForm(); setIsModalOpen(true); }}>
                <Text style={styles.popupIconText}>＋</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.popupBody}>
              {currentEvents.length === 0 ? (
                <Text style={styles.popupEmptyText}>No hay eventos para este día</Text>
              ) : (
                currentEvents.map((ev) => (
                  <TouchableOpacity key={ev.id} style={styles.popupEventCard} onPress={() => handleEditEvent(ev)} onLongPress={() => handleDeleteEvent(ev.id)}>
                    <View style={[styles.popupColorDot, { backgroundColor: ev.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.popupEventTitle}>{ev.title}</Text>
                      <Text style={styles.popupEventTime}>{ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
              {currentEvents.length > 0 && <Text style={styles.hintText}>Toca para editar · Mantén para eliminar</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BARRA CATEGORÍAS */}
      <View style={styles.bottomTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTabsScroll}>
          {activeCalendars.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.bottomTabChip, { backgroundColor: cat.active ? cat.color : '#E0E0E0' }]}
              onPress={() => toggleCalendarFilter(cat.id)}
            >
              <Text style={[styles.bottomTabText, { color: cat.active ? '#FFF' : '#666' }]}>
                {cat.active ? '✓ ' : ''}{cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setIsModalOpen(true); }}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* DRAWER */}
      <Modal visible={isDrawerOpen} animationType="slide" transparent={true}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>
            <Text style={styles.drawerHeaderTitle}>Kairós Calendar 🗿</Text>
            {['Año', 'Mes', 'Semana', 'Día', 'Agenda', 'Tareas'].map((v) => (
              <TouchableOpacity 
                key={v} 
                style={[styles.drawerItem, currentView === v && styles.activeDrawerItem]}
                onPress={() => { setCurrentView(v); setIsDrawerOpen(false); showAlert('Vista', `Vista ${v}`); }}
              >
                <Text style={[styles.drawerItemText, currentView === v && styles.activeDrawerText]}>{v}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.drawerDivider} />
            <TouchableOpacity style={styles.drawerSubItem} onPress={() => { setIsDrawerOpen(false); setIsSettingsOpen(true); }}>
              <Text style={styles.drawerSubItemText}>⚙️ Configuración</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setIsDrawerOpen(false)}>
              <Text style={styles.closeDrawerText}>Cerrar Menú</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsDrawerOpen(false)} />
        </View>
      </Modal>

      {/* MODAL EDITAR / CREAR EVENTO */}
      <Modal visible={isModalOpen} animationType="slide">
        <SafeAreaView style={styles.bc2Container}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            
            {/* AZUL SUPERIOR */}
            <View style={[styles.bc2HeaderBar, { backgroundColor: selectedCategory.color || '#1B66C9' }]}>
              <TouchableOpacity onPress={() => { setIsModalOpen(false); resetForm(); }}>
                <Text style={styles.bc2HeaderClose}>✕</Text>
              </TouchableOpacity>

              <View style={styles.bc2CategorySelector}>
                <Text style={styles.bc2CategoryText} numberOfLines={1}>{selectedCategory.name}</Text>
                <Text style={{ color: '#FFF', fontSize: 12 }}>▼</Text>
              </View>

              <View style={styles.bc2HeaderRight}>
                <TouchableOpacity onPress={() => showAlert('Color', 'Selección de paleta')}>
                  <Text style={styles.bc2IconHeader}>🎨</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bc2ListoBtn} onPress={handleSaveEvent}>
                  <Text style={styles.bc2ListoText}>✓ LISTO</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.bc2Body}>
              
              {/* CATEGORÍAS RÁPIDAS */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.bc2CatBar}
                contentContainerStyle={{ paddingHorizontal: 10 }}
              >
                {activeCalendars.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[styles.bc2CatChip, selectedCategoryId === cat.id && { backgroundColor: cat.color }]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text 
                      style={[styles.bc2CatChipText, selectedCategoryId === cat.id && { color: '#FFF' }]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* TÍTULO */}
              <View style={styles.bc2FieldCard}>
                <TextInput 
                  style={styles.bc2TitleInput} 
                  placeholder="Título" 
                  placeholderTextColor="#888" 
                  value={title} 
                  onChangeText={setTitle} 
                />
              </View>

              {/* DESDE / HASTA Y TODO EL DÍA */}
              <View style={styles.bc2TimeSection}>
                <View style={styles.bc2TimeRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.bc2SubLabel}>DESDE</Text>
                    <Text style={styles.bc2DateText} numberOfLines={1}>sáb, {selectedDay} oct</Text>
                  </View>
                  <TouchableOpacity onPress={() => openTimePicker('start')}>
                    <Text style={styles.bc2TimeInput}>{startTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bc2TimeRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.bc2SubLabel}>HASTA</Text>
                    <Text style={styles.bc2DateText} numberOfLines={1}>sáb, {selectedDay} oct</Text>
                  </View>
                  <TouchableOpacity onPress={() => openTimePicker('end')}>
                    <Text style={styles.bc2TimeInput}>{endTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bc2AllDayRow}>
                  <Text style={styles.bc2AllDayText}>GMT+2 hora de verano</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.bc2LabelText}>Todo el día</Text>
                    <Switch 
                      value={isAllDay} 
                      onValueChange={setIsAllDay} 
                      trackColor={{ true: '#1B66C9' }} 
                    />
                  </View>
                </View>
              </View>

              {/* UBICACIÓN */}
              <View style={styles.bc2InputRowCard}>
                <TextInput 
                  style={styles.bc2RowInput} 
                  placeholder="Ubicación" 
                  placeholderTextColor="#888" 
                  value={location} 
                  onChangeText={setLocation} 
                />
                <Text style={styles.bc2RowIcon}>📍</Text>
              </View>

              {/* DESCRIPCIÓN */}
              <View style={styles.bc2InputRowCard}>
                <TextInput 
                  style={[styles.bc2RowInput, { height: 60 }]} 
                  placeholder="Descripción" 
                  placeholderTextColor="#888" 
                  value={description} 
                  onChangeText={setDescription}
                  multiline 
                />
              </View>

              {/* RECORDATORIO */}
              <TouchableOpacity 
                style={styles.bc2InputRowCard} 
                onPress={() => showAlert('Recordatorio', 'Opciones: 10m antes, 1h antes, 1 día antes')}
              >
                <Text style={styles.bc2RowIcon}>🔔</Text>
                <Text style={styles.bc2RowText}>Recordatorio: {reminder}</Text>
              </TouchableOpacity>

              {/* REPETICIÓN */}
              <View style={styles.bc2BlockCard}>
                <Text style={styles.bc2SubLabel}>REPETICIÓN</Text>
                <TouchableOpacity onPress={() => showAlert('Repetición', 'Diario, Semanal, Mensual')}>
                  <Text style={styles.bc2BlockValue}>{repetition}</Text>
                </TouchableOpacity>
              </View>

              {/* AÑADIR PARTICIPANTE */}
              <View style={styles.bc2InputRowCard}>
                <TextInput 
                  style={styles.bc2RowInput} 
                  placeholder="Añadir Participante" 
                  placeholderTextColor="#888" 
                  value={participant} 
                  onChangeText={setParticipant} 
                />
                <Text style={styles.bc2RowIcon}>👤</Text>
              </View>

              {/* MUÉSTRAME COMO Y PRIVACIDAD */}
              <View style={styles.bc2BlockCard}>
                <Text style={styles.bc2SubLabel}>MUÉSTRAME COMO</Text>
                <TouchableOpacity onPress={() => setAvailability(availability === 'Ocupado' ? 'Disponible' : 'Ocupado')}>
                  <Text style={styles.bc2BlockValue}>{availability}</Text>
                </TouchableOpacity>

                <Text style={[styles.bc2SubLabel, { marginTop: 12 }]}>PROTECCIÓN DE DATOS</Text>
                <TouchableOpacity onPress={() => setPrivacy(privacy === 'Estándar' ? 'Privado' : 'Estándar')}>
                  <Text style={styles.bc2BlockValue}>{privacy}</Text>
                </TouchableOpacity>
              </View>

              {/* AÑADIR ADJUNTO (PRO) */}
              <View style={styles.bc2BlockCard}>
                <Text style={styles.bc2SubLabel}>AÑADIR ADJUNTO</Text>
                <Text style={styles.bc2ProTag}>Funciones Pro</Text>
                <View style={styles.bc2AttachIconsRow}>
                  <TouchableOpacity onPress={() => setAttachmentType('file')}><Text style={styles.bc2AttachIcon}>📱</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setAttachmentType('cloud')}><Text style={styles.bc2AttachIcon}>☁️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setAttachmentType('image')}><Text style={styles.bc2AttachIcon}>🖼️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setAttachmentType('camera')}><Text style={styles.bc2AttachIcon}>📷</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setAttachmentType('mic')}><Text style={styles.bc2AttachIcon}>🎙️</Text></TouchableOpacity>
                </View>
              </View>

              {/* ENLAZAR CONTACTO Y PLANTILLA */}
              <View style={styles.bc2BlockCard}>
                <Text style={styles.bc2BlockTitle}>Enlazar contacto en privado</Text>
                <Text style={styles.bc2ProTag}>Funciones Pro</Text>
                <View style={styles.bc2Divider} />
                <View style={styles.bc2RowBetween}>
                  <Text style={styles.bc2BlockTitle}>Guardar como Plantilla</Text>
                  <Text style={styles.bc2ProTag}>Funciones Pro</Text>
                </View>
              </View>

              {editingEventId && (
                <TouchableOpacity style={styles.bc2DeleteBtn} onPress={() => { setIsModalOpen(false); handleDeleteEvent(editingEventId); }}>
                  <Text style={styles.bc2DeleteText}>Eliminar Evento</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* MODAL SELECTOR DE HORA ESTILO RELOJ */}
      <Modal visible={showTimePickerModal} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.timePickerOverlay} activeOpacity={1} onPress={() => setShowTimePickerModal(false)}>
          <View style={styles.timePickerBox}>
            <Text style={styles.timePickerTitle}>Seleccionar Hora ({timePickerType === 'start' ? 'Desde' : 'Hasta'})</Text>
            <ScrollView style={{ maxHeight: 250 }}>
              <View style={styles.timeGrid}>
                {hoursList.map((timeStr) => (
                  <TouchableOpacity 
                    key={timeStr} 
                    style={styles.timeChip} 
                    onPress={() => selectTimeOption(timeStr)}
                  >
                    <Text style={styles.timeChipText}>{timeStr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.timePickerCloseBtn} onPress={() => setShowTimePickerModal(false)}>
              <Text style={styles.timePickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL CONFIGURACIÓN */}
      <Modal visible={isSettingsOpen} animationType="slide">
        <SafeAreaView style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.settingsHeaderTitle}>Configuración</Text>
          </View>
          <ScrollView style={styles.settingsList}>
            <Text style={styles.settingsSectionTitle}>Opciones de Kairós Calendar</Text>
            <TouchableOpacity style={styles.settingRow} onPress={() => showAlert('Temas', 'Ajustes de visualización')}>
              <Text style={styles.settingIcon}>🎨</Text>
              <Text style={styles.settingText}>Tema & Colores</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { 
    height: 56, 
    backgroundColor: '#1B66C9', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15,
    elevation: 4
  },
  hamburgerIcon: { color: '#FFF', fontSize: 22 },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  arrowIcon: { color: '#FFF', fontSize: 28, paddingHorizontal: 15, fontWeight: '300' },
  topBarTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayBtn: { color: '#1B66C9', fontSize: 13, fontWeight: 'bold', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  topIcon: { color: '#FFF', fontSize: 20 },
  optionsMenu: { position: 'absolute', top: 56, right: 10, width: 200, backgroundColor: '#2C2C2C', borderRadius: 8, paddingVertical: 5, zIndex: 999, elevation: 10 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 15 },
  optionText: { color: '#FFF', fontSize: 14 },
  weekHeader: { flexDirection: 'row', backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 6 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#70757A' },
  calendarBody: { flex: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingTop: 4 },
  dayCell: { width: '14.28%', height: 78, borderWidth: 0.5, borderColor: '#F0F0F0', padding: 3, backgroundColor: '#FFF' },
  dayCellEmpty: { width: '14.28%', height: 78, borderWidth: 0.5, borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
  selectedDayCell: { backgroundColor: '#E8F0FE', borderColor: '#1B66C9', borderWidth: 1 },
  dayNumberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  dayNumberWrapper: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  todayCircle: { backgroundColor: '#1B66C9' },
  dayNumber: { fontSize: 13, color: '#202124', fontWeight: '600' },
  selectedDayNumber: { color: '#1B66C9', fontWeight: 'bold' },
  todayText: { color: '#FFF', fontWeight: 'bold' },
  weekNumText: { fontSize: 9, color: '#B0B0B0', fontWeight: '500' },
  eventBadge: { marginTop: 2, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
  eventBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  moreEventsText: { fontSize: 8, color: '#666', marginTop: 1, fontWeight: '600' },
  agendaSection: { padding: 15, borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingBottom: 80, backgroundColor: '#FAFAFA' },
  agendaSectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#202124' },
  emptyAgendaText: { fontSize: 12, color: '#70757A', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15 },
  agendaCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', elevation: 1 },
  agendaColorBar: { width: 4, height: '100%', borderRadius: 2, marginRight: 10, alignSelf: 'stretch' },
  agendaCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#202124', marginBottom: 2 },
  agendaCardSub: { fontSize: 12, color: '#5F6368', marginBottom: 2 },
  agendaCardLoc: { fontSize: 11, color: '#1B66C9' },
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dayPopupWindow: { width: '85%', maxHeight: '70%', backgroundColor: '#FFF', borderRadius: 12, elevation: 8, overflow: 'hidden' },
  popupHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  popupEventsCount: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  popupIconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center' },
  popupIconText: { fontSize: 16, color: '#1B66C9', fontWeight: 'bold' },
  popupBody: { padding: 12, maxHeight: 400 },
  popupEmptyText: { fontSize: 13, color: '#666', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  popupEventCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#EEE', borderRadius: 6 },
  popupColorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  popupEventTitle: { fontSize: 14, fontWeight: 'bold', color: '#202124', marginBottom: 2 },
  popupEventTime: { fontSize: 12, color: '#666' },
  hintText: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  bottomTabsContainer: { height: 50, backgroundColor: '#F1F3F4', borderTopWidth: 1, borderTopColor: '#E0E0E0', justifyContent: 'center' },
  bottomTabsScroll: { paddingHorizontal: 10, alignItems: 'center' },
  bottomTabChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 16, marginRight: 8, elevation: 1 },
  bottomTabText: { fontSize: 12, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 65, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B66C9', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabIcon: { color: '#FFF', fontSize: 30, fontWeight: 'bold', marginTop: -2 },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawerContainer: { width: '75%', backgroundColor: '#FFF', padding: 20, paddingTop: 50 },
  drawerHeaderTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 25, color: '#202124' },
  drawerItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 2 },
  activeDrawerItem: { backgroundColor: '#E8F0FE' },
  drawerItemText: { fontSize: 15, color: '#3C4043', fontWeight: '500' },
  activeDrawerText: { color: '#1B66C9', fontWeight: 'bold' },
  drawerDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 15 },
  drawerSubItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  drawerSubItemText: { fontSize: 14, color: '#5F6368' },
  closeDrawerBtn: { marginTop: 25, padding: 12, alignItems: 'center', backgroundColor: '#F1F3F4', borderRadius: 8 },
  closeDrawerText: { color: '#3C4043', fontWeight: 'bold' },

  // ESTILOS BUSINESS CALENDAR 2
  bc2Container: { flex: 1, backgroundColor: '#ECECEC' },
  bc2HeaderBar: { 
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15 
  },
  bc2HeaderClose: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  bc2CategorySelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 4,
    gap: 6
  },
  bc2CategoryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, maxWidth: 140 },
  bc2HeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  bc2IconHeader: { fontSize: 20, color: '#FFF' },
  bc2ListoBtn: { flexDirection: 'row', alignItems: 'center' },
  bc2ListoText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  bc2Body: { padding: 10 },
  bc2CatBar: { 
    flexDirection: 'row', 
    marginBottom: 10, 
    maxHeight: 40,
    width: '100%',
  },
  bc2CatChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bc2CatChipText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#444',
    maxWidth: 100,
  },
  bc2FieldCard: { backgroundColor: '#FFF', borderRadius: 2, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  bc2TitleInput: { fontSize: 22, color: '#333', padding: 0 },
  bc2TimeSection: { backgroundColor: '#FFF', borderRadius: 2, padding: 12, marginBottom: 8 },
  bc2TimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bc2SubLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', letterSpacing: 0.5 },
  bc2DateText: { fontSize: 16, color: '#333', marginTop: 2 },
  bc2TimeInput: { 
    fontSize: 20, 
    color: '#1B66C9', 
    fontWeight: 'bold', 
    width: 80,
    textAlign: 'right',
    paddingVertical: 5
  },
  bc2AllDayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  bc2AllDayText: { fontSize: 12, color: '#888' },
  bc2LabelText: { fontSize: 14, color: '#333' },
  bc2InputRowCard: { backgroundColor: '#FFF', borderRadius: 2, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bc2RowInput: { flex: 1, fontSize: 15, color: '#333', padding: 0 },
  bc2RowIcon: { fontSize: 18, color: '#666', marginLeft: 10 },
  bc2RowText: { fontSize: 15, color: '#333' },
  bc2BlockCard: { backgroundColor: '#FFF', borderRadius: 2, padding: 12, marginBottom: 8 },
  bc2BlockValue: { fontSize: 15, color: '#333', marginTop: 4, marginBottom: 4 },
  bc2ProTag: { fontSize: 11, color: '#D93025', fontWeight: 'bold', marginTop: 2 },
  bc2AttachIconsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  bc2AttachIcon: { fontSize: 22 },
  bc2BlockTitle: { fontSize: 14, color: '#333' },
  bc2Divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  bc2RowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bc2DeleteBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EA4335', paddingVertical: 12, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  bc2DeleteText: { color: '#EA4335', fontWeight: 'bold' },

  // ESTILOS DEL MODAL SELECTOR DE HORA
  timePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  timePickerBox: { width: '80%', backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 10 },
  timePickerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B66C9', marginBottom: 15, textAlign: 'center' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeChip: { width: '30%', backgroundColor: '#E8F0FE', paddingVertical: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  timeChipText: { fontSize: 15, fontWeight: 'bold', color: '#1B66C9' },
  timePickerCloseBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center', backgroundColor: '#F1F3F4', borderRadius: 8 },
  timePickerCloseText: { color: '#333', fontWeight: 'bold', fontSize: 14 },

  settingsContainer: { flex: 1, backgroundColor: '#FFF' },
  settingsHeader: { height: 56, backgroundColor: '#1B66C9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  backArrow: { color: '#FFF', fontSize: 24, marginRight: 20 },
  settingsHeaderTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  settingsList: { padding: 15 },
  settingsSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#70757A', marginBottom: 10, marginTop: 5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  settingIcon: { fontSize: 18, marginRight: 15, width: 25, textAlign: 'center' },
  settingText: { fontSize: 14, color: '#202124', fontWeight: '500' }
});
