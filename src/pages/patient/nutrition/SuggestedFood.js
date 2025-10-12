import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { suggestFoodsByAi, updateMenuFood, getMenuFood } from '../../../redux/foodAiSlice';
import { InsertFoods } from '../../../redux/foodSlice';

const { width, height } = Dimensions.get('window');

export default function SuggestedFood() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [confirmedIndex, setConfirmedIndex] = useState(null);
  const [kcalGroups, setKcalGroups] = useState([]);

  // Kiểm tra calo hiện tại
  useEffect(() => {
    const fetchMenuFood = async () => {
      try {
        const data = await dispatch(getMenuFood());
        const menuFood = data.payload.DT;

        setKcalGroups(
          menuFood.map((m) => ({
            range: `${m.caloMin} — ${m.caloMax} kcal`,
            category: m.title,
            target: m.description,
            img: m.image,
            id: m._id,
          }))
        );

        // Nếu user._id có trong mảng userIds thì set confirmedIndex
        menuFood.forEach((m, idx) => {
          if (m.userId?.includes(user.userId)) {
            setConfirmedIndex(idx);
          }
        });
      } catch (error) {
        console.error('Error fetching menu food:', error);
      }
    };

    if (user.userId) {
      fetchMenuFood();
    }
  }, [user.userId, dispatch]);

  const handleConfirm = async (item, index) => {
    try {
      setConfirmedIndex(index); // Chuyển trạng thái xác nhận

      const res = await dispatch(
        updateMenuFood({ menuFoodId: item.id, userId: user.userId })
      );

      if (res.payload.EC === 0) {
        const data = res.payload.DT.menuFood;

        const response = await dispatch(
          suggestFoodsByAi({
            min: data.caloMin,
            max: data.caloMax,
            mean: 6,
            currentCalo: data.caloCurrent,
            menuFoodId: data._id,
          })
        );

        if (response.payload) {
          await dispatch(InsertFoods({ userId: user.userId, data: response?.payload?.result.chosen }));
        }
      }
    } catch (error) {
      console.error('Error confirming food:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          
          <View style={styles.heroContent}>
            {/* Filter Tags */}
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Ít tinh bột - Tăng cơ</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>4 bữa/ngày</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.heroTitle}>
              Meal plan chuẩn gym: Tăng cơ, Giảm mỡ, Sống khỏe
            </Text>

            {/* Description */}
            <Text style={styles.heroDescription}>
              Meal plan chuẩn gym: Tăng cơ, Giảm mỡ, Sống khỏe là chế độ ăn uống được thiết kế khoa học, giúp người tập luyện cải thiện vóc dáng hiệu quả và duy trì sức khỏe lâu dài.
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            Các mức kcal/ngày & đối tượng áp dụng
          </Text>

          <View style={styles.cardsContainer}>
            {kcalGroups.map((item, index) => (
              <View key={index} style={styles.cardWrapper}>
                <View
                  style={[
                    styles.card,
                    confirmedIndex === index && styles.confirmedCard,
                  ]}
                >
                  {/* Image */}
                  <Image
                    source={{ uri: item.img }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />

                  {/* Body */}
                  <View style={styles.cardBody}>
                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>

                    <Text style={styles.cardTitle}>{item.range}</Text>
                    <Text style={styles.cardDescription}>{item.target}</Text>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        confirmedIndex === index && styles.confirmedButton,
                      ]}
                      onPress={() => handleConfirm(item, index)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.confirmButtonText,
                          confirmedIndex === index && styles.confirmedButtonText,
                        ]}
                      >
                        {confirmedIndex === index ? '✅ Đã xác nhận' : 'Xác nhận'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroContainer: {
    height: 350,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  tagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 26,
  },
  heroDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  cardsContainer: {
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  confirmedCard: {
    borderWidth: 2,
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 16,
  },
  categoryBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmedButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  confirmButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmedButtonText: {
    color: '#ffffff',
  },
});