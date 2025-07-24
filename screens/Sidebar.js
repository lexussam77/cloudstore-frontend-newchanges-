import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const Sidebar = ({ items, onClose }) => {
  const handleItemPress = (item) => {
    // Close sidebar first
    onClose();
    
    // Then execute the action
    if (item.onPress) {
      item.onPress();
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarContent}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleItemPress(item)}
          >
            <Image source={item.icon} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Overlay to close sidebar when tapping outside */}
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onClose}
        activeOpacity={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContent: {
    width: 280,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  overlay: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
    resizeMode: 'contain',
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
  },
});

export default Sidebar;