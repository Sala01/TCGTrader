import { StyleSheet } from 'react-native';
import Colors from './colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.headerBackground,
  },
  logo: {
    width: 50,
    height: 50,
  },
  slogan: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  text: {
    color: Colors.text,
    fontSize: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardText: {
    color: Colors.text,
    fontSize: 14,
  },
  footerButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  footerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
