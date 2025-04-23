import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, TextInput, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';

type Session = {
  id: string;
  name: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: string;
  expectedDuration?: number; // Added expected duration
};

export default function TimekeeperScreen() {
 const params = useLocalSearchParams<{
    pastorName: string;
    serviceType: string;
    location: string;
    serviceTime: string; // Add serviceTime
    timekeeperName: string;
  }>();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [pendingSessions, setPendingSessions] = useState<Omit<Session, 'startTime' | 'endTime' | 'duration'>[]>([]);

  const onDragEnd = ({ data }: { data: Omit<Session, 'startTime' | 'endTime' | 'duration'>[] }) => {
    setPendingSessions(data);
  };
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionExpectedDuration, setNewSessionExpectedDuration] = useState(''); // State for expected duration input
  //const sessionNames = ['Worship', 'Message', 'Offering', 'Announcements', 'Other']; // Predefined session names
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isOvertime, setIsOvertime] = useState(false); // Added state for overtime
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sampleDrop = [
    { label: 'Pre Service Loop', value: 'Pre Service Loop' },
    { label: 'Announcement Loop', value: 'Announcement Loop' },
    { label: 'Call for Parents', value: 'Call for Parents' },
    { label: 'Call for Worship', value: 'Call for Worship' },
    { label: 'Praise and Worship', value: 'Praise and Worship' },
    { label: 'Transition', value: 'Transition' },
    { label: 'Reminders', value: 'Reminders' },
    { label: 'Announcement', value: 'Announcement' },
    { label: 'Giving', value: 'Giving'},
    { label: 'Giving Song', value: 'Giving Song' },
    { label: 'Reading of The Word', value: 'Reading of The Word'},
    { label: 'Bumper Video', value: 'Bumper Video' },
    { label: 'First Timers', value: 'First Timers' },
    { label: 'Word', value: 'Word' },
    { label: 'Ministry Time', value: 'Ministry Time' },
    { label: 'Benediction', value: 'Benediction' },
    { label: 'Exit Instruction', value: 'Exit Instruction' },
    { label: 'Other', value: 'Other' },
  ];
 // const [value, setValue] = useState(null);
 // const [isFocus, setIsFocus] = useState(false);
  const [dropdownValue, setDropdownValue] = useState(null);

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calculate duration between two dates
  const calculateDuration = (start: Date, end: Date): string => {
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format display time (countdown or overtime)
  const formatDisplayTime = (totalSeconds: number): string => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  // Update elapsed time for current session
  useEffect(() => {
    if (currentSession?.startTime && !currentSession?.endTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - currentSession.startTime!.getTime()) / 1000);

        if (currentSession.expectedDuration) {
          const expectedSeconds = currentSession.expectedDuration * 60;
          const remainingSeconds = expectedSeconds - elapsedSeconds;
          const overtime = remainingSeconds < 0;
          setIsOvertime(overtime);
          setElapsedTime(formatDisplayTime(remainingSeconds));
        } else {
          setIsOvertime(false); // Reset overtime status if no expected duration
          setElapsedTime(calculateDuration(currentSession.startTime!, now));
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentSession]);

  const addToSessionQueue = () => {
    if (!newSessionName.trim()) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    let expectedDurationMinutes: number | undefined = undefined;
    if (newSessionExpectedDuration.trim()) {
      const parsedDuration = parseInt(newSessionExpectedDuration, 10);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        Alert.alert('Error', 'Please enter a valid positive number for expected duration in minutes.');
        return;
      }
      expectedDurationMinutes = parsedDuration;
    }

    const pendingSession = {
      id: Date.now().toString(),
      name: newSessionName,
      expectedDuration: expectedDurationMinutes,
    };

    setPendingSessions([...pendingSessions, pendingSession]);
    setNewSessionName('');
    setNewSessionExpectedDuration('');
  };

  const startNextSession = () => {
    if (currentSession) {
      Alert.alert('Session in progress', 'Please end the current session before starting a new one.');
      return;
    }

    if (pendingSessions.length === 0) {
      Alert.alert('No Sessions', 'Please add sessions to the queue first.');
      return;
    }
 
    const [nextSession, ...remainingSessions] = pendingSessions;
    const session: Session = {
      ...nextSession,
      startTime: new Date(),
      endTime: null,
      duration: '00:00:00',
    };

    setCurrentSession(session);
    setPendingSessions(remainingSessions);
    setElapsedTime(session.expectedDuration ? formatDisplayTime(session.expectedDuration * 60) : '00:00:00');
    setIsOvertime(false);
  };

  const deletePendingSession = (id: string) => {
    setPendingSessions(pendingSessions.filter(session => session.id !== id));
  };

  const endCurrentSession = () => {
    if (!currentSession) {
      return;
    }

    const now = new Date();
    const updatedSession = {
      ...currentSession,
      endTime: now,
      duration: calculateDuration(currentSession.startTime!, now),
    };

    setSessions([...sessions, updatedSession]);
    setCurrentSession(null);
    setElapsedTime('00:00:00');
  };

  const generatePdf = async () => {
    if (sessions.length === 0 && !currentSession) {
      Alert.alert('No Data', 'There is no session data to export.');
      return;
    }

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 10px; color: #3498db; text-align: center; }
            h2 { font-size: 20px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            p { font-size: 16px; margin-bottom: 5px; }
            .service-info { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3498db; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .current-session-row { background-color: #fff5f5; border-left: 4px solid #e74c3c; }
            .duration-cell { font-weight: bold; color: #3498db; }
          </style>
        </head>
        <body>
          <h1>${params.serviceType} - Service Report</h1>
          <div class="service-info">
            <h2>Service Details</h2>
            <p><strong>Pastor:</strong> ${params.pastorName}</p>
            <p><strong>Location:</strong> ${params.location}</p>
            <p><strong>Service Time:</strong> ${params.serviceTime}</p>
            <p><strong>Timekeeper:</strong> ${params.timekeeperName}</p>
          </div>

          <h2>Session History</h2>
          <table>
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Start Time</th>
                <th>End Time / Status</th>
                <th>Expected Duration (min)</th>
                <th>Duration / Elapsed</th>
                <th>Overtime (min)</th>
              </tr>
            </thead>
            <tbody>
              ${currentSession ? `
                <tr class="current-session-row">
                  <td>${currentSession.name}</td>
                  <td>${formatTime(currentSession.startTime!)}</td>
                  <td>In Progress</td>
                  <td>${currentSession.expectedDuration ? currentSession.expectedDuration : 'N/A'}</td>
                  <td class="duration-cell">${isOvertime ? `<span style="color: red;">OVERTIME ${elapsedTime.substring(1)}</span>` : elapsedTime}</td>
                  <td>${isOvertime ? `<span style="color: red;">${Math.ceil(Math.abs(parseInt(elapsedTime.split(':')[0]) * 3600 + parseInt(elapsedTime.split(':')[1]) * 60 + parseInt(elapsedTime.split(':')[2])) / 60)}</span>` : 'N/A'}</td>
                </tr>
              ` : ''}
              ${sessions.map(session => {
                // Helper function to parse HH:MM:SS duration to seconds
                const parseDurationToSeconds = (durationString: string): number => {
                  const parts = durationString.split(':').map(Number);
                  if (parts.length === 3) {
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                  }
                  return 0; // Should not happen with valid duration
                };

                let overtimeMinutes = 'N/A';
                let overtimeStyle = '';
                if (session.expectedDuration) {
                  const durationSeconds = parseDurationToSeconds(session.duration);
                  const expectedSeconds = session.expectedDuration * 60;
                  if (durationSeconds > expectedSeconds) {
                    const overtimeSeconds = durationSeconds - expectedSeconds;
                    overtimeMinutes = Math.ceil(overtimeSeconds / 60).toString(); // Calculate overtime in minutes (ceil)
                    overtimeStyle = ' style="color: red; font-weight: bold;"';
                  }
                }

                return `
                  <tr>
                    <td>${session.name}</td>
                    <td>${formatTime(session.startTime!)}</td>
                    <td>${formatTime(session.endTime!)}</td>
                    <td>${session.expectedDuration ? session.expectedDuration : 'N/A'}</td>
                    <td class="duration-cell">${session.duration}</td>
                    <td${overtimeStyle}>${overtimeMinutes}${overtimeMinutes !== 'N/A' ? ' min' : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ${sessions.length === 0 && !currentSession ? '<p>No sessions recorded.</p>' : ''}
        </body>
      </html>
    `;



    try {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const filename = `ServiceReport_${formattedDate}_${params.location.replace(/[^a-zA-Z0-9]/g, '_')}_${params.serviceTime.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      console.log('File has been saved to:', uri);
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Service Report' });
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert('Error', 'Could not generate or share the PDF.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* Service Details */}
      
        <View style={styles.serviceInfoContainer}>
          <ThemedText style={styles.title}>{params.serviceType}</ThemedText>
          <ThemedText style={styles.serviceInfo}>Pastor: {params.pastorName}</ThemedText>
          <ThemedText style={styles.serviceInfo}>Location: {params.location}</ThemedText>
          <ThemedText style={styles.serviceInfo}>Service Time: {params.serviceTime}</ThemedText> {/* Display service time */}
          <ThemedText style={styles.serviceInfo}>Timekeeper: {params.timekeeperName}</ThemedText>
        </View>

        {/* Current Session */}
        <View style={styles.currentSessionContainer}>
          <ThemedText style={styles.sectionTitle}>Current Session</ThemedText>
          {currentSession ? (
            <View style={styles.activeSessionContainer}>
              <ThemedText style={styles.sessionName}>{currentSession.name}</ThemedText>
              <ThemedText style={styles.timeInfo}>
                Started: {formatTime(currentSession.startTime!)}
                {currentSession.expectedDuration && ` (Expected: ${currentSession.expectedDuration} min)`}
              </ThemedText>
              <ThemedText style={[styles.elapsedTime, isOvertime && styles.overtimeText]}>
                {isOvertime ? `OVERTIME ${elapsedTime.substring(1)}` : elapsedTime}
              </ThemedText>
              <TouchableOpacity style={styles.endButton} onPress={endCurrentSession}>
                <ThemedText style={styles.buttonText}>End Session</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.newSessionContainer}>
              <View style={styles.sessionNameContainer}>
              <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={sampleDrop}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select session"
                    searchPlaceholder="Search sessions..."
                    value={dropdownValue}
                    onChange={item => {
                      setDropdownValue(item.value);
                      setNewSessionName(item.value === 'Other' ? '' : item.value);
                    }}
                    renderLeftIcon={() => (
                      <AntDesign style={styles.icon} color="black" name="clockcircle" size={20} />
                    )}
                 />
                <TextInput
                  style={styles.input}
                  value={newSessionName}
                  onChangeText={setNewSessionName}
                  placeholder="Enter session name"
                  placeholderTextColor="#888"
                />
                       
                
                </View>    
                  {/* test dropdown end*/}
              <TextInput // Added input for expected duration
                style={styles.input}
                value={newSessionExpectedDuration}
                onChangeText={setNewSessionExpectedDuration}
                placeholder="Expected duration (minutes, optional)"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.addButton} onPress={addToSessionQueue}>
                <ThemedText style={styles.buttonText}>Add to Queue</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={startNextSession}>
                <ThemedText style={styles.buttonText}>Start Next Session</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pending Sessions */}
        <View style={styles.historyContainer}>
          <ThemedText style={styles.sectionTitle}>Pending Sessions</ThemedText>
          {pendingSessions.length === 0 ? (
            <ThemedText style={styles.emptyText}>No sessions in queue</ThemedText>
          ) : (
            <View style={{flex: 1}}>
            <DraggableFlatList
              data={pendingSessions}
              renderItem={({ item, drag }) => (
                <View key={item.id} style={styles.historyItem}>
                  <TouchableOpacity onLongPress={drag}>
                    <ThemedText style={styles.historyName}>{item.name}</ThemedText>
                    {item.expectedDuration && (
                      <ThemedText style={styles.historyTime}>
                        Expected: {item.expectedDuration} min
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => deletePendingSession(item.id)}
                  >
                    <AntDesign name="close" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
              onDragEnd={onDragEnd}
              contentContainerStyle={{flexGrow: 1}}
            />
          </View>
          )}
        </View>

        {/* Session History */}
        <View style={styles.historyContainer}>
          <ThemedText style={styles.sectionTitle}>Session History</ThemedText>
          {sessions.length === 0 && !currentSession ? (
            <ThemedText style={styles.emptyText}>No sessions recorded yet</ThemedText>
          ) : (
            <> 
              {/* Display current session first if active */}
              {currentSession && (
                <View style={[styles.historyItem, styles.currentHistoryItem]}>
                  <ThemedText style={styles.historyName}>{currentSession.name} (In Progress)</ThemedText>
                  <View style={styles.historyTimeContainer}>
                    <ThemedText style={styles.historyTime}>
                      Started: {formatTime(currentSession.startTime!)}
                      {currentSession.expectedDuration && ` (Expected: ${currentSession.expectedDuration} min)`}
                    </ThemedText>
                    <ThemedText style={[styles.historyDuration, isOvertime && styles.overtimeText]}>
                      {isOvertime ? `OVERTIME ${elapsedTime.substring(1)}` : `Elapsed: ${elapsedTime}`}
                    </ThemedText>
                  </View>
                </View>
              )}
              {/* Display completed sessions */}
              {sessions.map((session) => (
                <View key={session.id} style={styles.historyItem}>
                  <ThemedText style={styles.historyName}>{session.name}</ThemedText>
                  <View style={styles.historyTimeContainer}>
                    <ThemedText style={styles.historyTime}>
                      Start: {formatTime(session.startTime!)}
                    </ThemedText>
                    <ThemedText style={styles.historyTime}>
                      End: {formatTime(session.endTime!)}
                    </ThemedText>
                    {session.expectedDuration && (
                      <ThemedText style={styles.historyTime}>
                        Expected: {session.expectedDuration} min
                      </ThemedText>
                    )}
                    <ThemedText style={styles.historyDuration}>
                      Duration: {session.duration}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton} onPress={generatePdf}>
          <ThemedText style={styles.buttonText}>Generate PDF Report</ThemedText>
        </TouchableOpacity>
        </ScrollView >
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
   },
  scrollView: {
    padding: 20,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  serviceInfoContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  serviceInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  currentSessionContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  activeSessionContainer: {
    alignItems: 'center',
  },
  sessionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timeInfo: {
    fontSize: 16,
    marginBottom: 5,
  },
  elapsedTime: {
    fontSize: 48, // Increased font size
    fontWeight: 'bold',
    marginVertical: 30,
    marginHorizontal: 40,
    color: '#3498db',
    textAlign: 'center',
    paddingTop: 30,
    lineHeight: 50,
  },
  overtimeText: {
    color: '#e74c3c', // Red color for overtime
  },
  newSessionContainer: {
    width: '100%',
  },
  sessionNameContainer: {
    marginBottom: 15,
  },
  sessionNameScroll: {
    marginBottom: 10,
  },
  sessionNameButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedSessionName: {
    backgroundColor: '#3498db',
  },
  sessionNameText: {
    fontSize: 14,
  },
  selectedSessionNameText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  endButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
  historyItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 5,
  },
  currentHistoryItem: {
    borderColor: '#e74c3c',
    borderWidth: 1,
    backgroundColor: '#fff5f5',
  },
  historyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyTimeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  historyTime: {
    fontSize: 14,
    marginBottom: 3,
  },
  historyDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 5,
  },
  exportButton: {
    backgroundColor: '#9b59b6', // Purple color for export
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20, // Add some margin top
  },
  //dropdown
  dropdown: {
    margin: 16,
    height: 50,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});