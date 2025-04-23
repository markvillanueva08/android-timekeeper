import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the service details screen
  return <Redirect href="/screens/service-details" />;
}