import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { setWithExpiry, getWithExpiry } from '../../../components/customizeStorage'

const StatsGrid = (target, foods) => {
  const targetCalo = target; // Mục tiêu calo

  const calculateTotals = () => {
    let totalCalo = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    foods.forEach(food => {
      if (food.checked) {
        const [protein, carbs, fat] = food.macros.map(m => parseFloat(m.replace('g', '')));
        const cal = parseFloat(food.details.split('•')[1].replace('cal', '').trim());

        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;
        totalCalo += cal;
      }
    });

    return {
      totalCalo: totalCalo.toFixed(1),
      totalProtein: totalProtein.toFixed(1),
      totalCarbs: totalCarbs.toFixed(1),
      totalFat: totalFat.toFixed(1),
    };
  };

  const calculateTarget = () => {
    let targetCalo = 0;
    let targetProtein = 0;
    let targetCarbs = 0;
    let targetFat = 0;

    foods.forEach(food => {
      const [protein, carbs, fat] = food.macros.map(m => parseFloat(m.replace('g', '')));
      const cal = parseFloat(food.details.split('•')[1].replace('cal', '').trim());

      targetProtein += protein;
      targetCarbs += carbs;
      targetFat += fat;
      targetCalo += cal;
    });

    return {
      targetCalo: targetCalo.toFixed(1),
      targetProtein: targetProtein.toFixed(1),
      targetCarbs: targetCarbs.toFixed(1),
      targetFat: targetFat.toFixed(1),
    };
  };

  const { targetProtein, targetCarbs, targetFat } = calculateTarget();
  const { totalCalo, totalProtein, totalCarbs, totalFat } = calculateTotals();

  const stats = [
    {
      title: "Calories hôm nay",
      value: totalCalo,
      target: targetCalo,
      percentage: Math.round((totalCalo / targetCalo) * 100),
      trend: "up",
      color: "primary",
      unit: "kcal", // ✅
    },
    {
      title: "Chất đạm",
      value: totalProtein,
      target: targetProtein,
      percentage: Math.round((totalProtein / targetProtein) * 100),
      trend: "up",
      color: "success",
      unit: "g",
    },
    {
      title: "Đường bột",
      value: totalCarbs,
      target: targetCarbs,
      percentage: Math.round((totalCarbs / targetCarbs) * 100),
      trend: "down",
      color: "warning",
      unit: "g",
    },
    {
      title: "Chất béo",
      value: totalFat,
      target: targetFat,
      percentage: Math.round((totalFat / targetFat) * 100),
      trend: "up",
      color: "danger",
      unit: "g",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với HealthTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

const FoodTrackerApp = () => {
  const [foods, setFoods] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState({
    sáng: true,
    trưa: true,
    tối: true,
    'ăn vặt': true
  });

  // Hàm phân bổ thực phẩm vào bữa ăn hợp lý cho bệnh nhân tiểu đường
  const assignMealsToFoods = (foodItems) => {
    const meals = ['sáng', 'trưa', 'tối', 'ăn vặt'];
    const mealPreferences = {
      sáng: { protein: 0.3, carbs: 0.25, fat: 0.2 },
      trưa: { protein: 0.25, carbs: 0.3, fat: 0.25 },
      tối: { protein: 0.2, carbs: 0.2, fat: 0.3 },
      'ăn vặt': { protein: 0.25, carbs: 0.25, fat: 0.25 }
    };

    return foodItems.map((food, index) => {
      const protein = parseFloat(food.chat_dam);
      const carbs = parseFloat(food.duong_bot);
      const fat = parseFloat(food.chat_beo);
      const total = protein + carbs + fat;

      let bestMeal = meals[index % meals.length]; // fallback: chia đều round-robin

      if (total > 0) {
        const proteinRatio = protein / total;
        const carbsRatio = carbs / total;
        const fatRatio = fat / total;

        let bestScore = Infinity;
        meals.forEach(meal => {
          const pref = mealPreferences[meal];
          const score = Math.abs(proteinRatio - pref.protein) +
            Math.abs(carbsRatio - pref.carbs) +
            Math.abs(fatRatio - pref.fat);
          if (score < bestScore) {
            bestScore = score;
            bestMeal = meal;
          }
        });
      }

      return { ...food, meal: bestMeal };
    });
  };

  useEffect(() => {
    const loadFood = async () => {
      const food = await getWithExpiry("food"); // ✅ await
      if (food && food?.chosen?.length > 0) {
        const mappedFoods = food.chosen.map((item) => ({
          id: item.name,
          name: item.name,
          image: item.image,
          details: `${item.weight}g • ${item.calo}cal`,
          macros: [
            `${item.chat_dam}g Protein`,
            `${item.duong_bot}g Carbs`,
            `${item.chat_beo}g Fat`,
          ],
          checked: false,
        }));
        setFoods(mappedFoods);
      }
    };
    loadFood();
  }, []);

  const toggleChecked = (index) => {
    const updatedFoods = [...foods];
    updatedFoods[index].checked = !updatedFoods[index].checked;
    setFoods(updatedFoods);
  };

  const toggleMealExpansion = (mealLabel) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealLabel]: !prev[mealLabel]
    }));
  };

  const caloriesByMeal = (foods) => {
    const result = {
      sáng: 0,
      trưa: 0,
      tối: 0,
      'ăn vặt': 0
    };

    foods.forEach((food) => {
      if (food.checked) {
        const cal = parseFloat(food.details.split('•')[1].replace('cal', '').trim());
        result[food.meal] += cal;
      }
    });

    return result;
  };

  // Hàm tạo thời gian bữa ăn phù hợp cho bệnh nhân tiểu đường
  const getMealTime = (mealLabel) => {
    const mealTimes = {
      sáng: {
        time: '7:00 - 8:00',
        tip: 'Ăn sáng trong vòng 1 giờ sau khi thức dậy',
        advice: 'Bữa sáng giàu protein giúp ổn định đường huyết và no lâu'
      },
      trưa: {
        time: '12:00 - 13:00',
        tip: 'Ăn trưa cách bữa sáng 4-5 giờ',
        advice: 'Bữa trưa cân bằng dinh dưỡng, ưu tiên rau xanh và protein'
      },
      tối: {
        time: '18:00 - 19:00',
        tip: 'Ăn tối cách giờ ngủ ít nhất 3 giờ',
        advice: 'Bữa tối ít carbs, nhiều rau xanh để kiểm soát đường huyết'
      },
      'ăn vặt': {
        time: '15:00 - 16:00',
        tip: 'Ăn vặt giữa bữa trưa và tối',
        advice: 'Bữa phụ nhẹ nhàng, tránh thực phẩm nhiều đường'
      }
    };
    return mealTimes[mealLabel] || { time: '', tip: '', advice: '' };
  };

  const renderMeal = (mealLabel) => {
    const mealTime = getMealTime(mealLabel);
    const mealFoods = foods.filter(f => f.meal === mealLabel);
    const mealCalories = caloriesByMeal(foods)[mealLabel] || 0;
    const mealCount = mealFoods.filter(f => f.checked).length;

    // Tính toán dinh dưỡng cho bữa ăn này
    const mealNutrition = mealFoods.reduce((acc, food) => {
      if (food.checked) {
        const [protein, carbs, fat] = food.macros.map(m => parseFloat(m.replace('g', '')));
        const cal = parseFloat(food.details.split('•')[1].replace('cal', '').trim());
        acc.protein += protein;
        acc.carbs += carbs;
        acc.fat += fat;
      }
      return acc;
    }, { protein: 0, carbs: 0, fat: 0 });

    // làm tròn sau khi reduce
    mealNutrition.protein = mealNutrition.protein.toFixed(1);
    mealNutrition.carbs = mealNutrition.carbs.toFixed(1);
    mealNutrition.fat = mealNutrition.fat.toFixed(1);

    // Đánh giá mức độ phù hợp cho bệnh nhân tiểu đường
    const getDiabetesRating = () => {
      if (mealNutrition.carbs > 30) return { level: 'warning', text: '⚠️ Nhiều carbs - cần theo dõi đường huyết', color: 'warning' };
      if (mealNutrition.protein > 15) return { level: 'success', text: '✅ Tốt - giàu protein ổn định đường huyết', color: 'success' };
      if (mealNutrition.fat > 10) return { level: 'info', text: '💡 Nhiều chất béo - no lâu nhưng cần kiểm soát', color: 'info' };
      return { level: 'secondary', text: '📊 Cân bằng dinh dưỡng', color: 'secondary' };
    };

    const diabetesRating = getDiabetesRating();

    // Màu sắc hài hòa cho từng bữa ăn
    const mealColors = {
      sáng: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
      trưa: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },
      tối: { bg: '#e8f5e8', border: '#4caf50', text: '#388e3c' },
      'ăn vặt': { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' }
    };

    const currentMealColor = mealColors[mealLabel];

    return (
      <div className="mb-4 mt-4">
        {/* Header của bữa ăn với màu sắc hài hòa */}
        <div className="rounded-3 shadow-sm border-0 mb-3" style={{
          backgroundColor: currentMealColor.bg,
          borderLeft: `4px solid ${currentMealColor.border}`
        }}>
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <h4 className="mb-0 fw-bold" style={{ color: currentMealColor.text }}>
                    Buổi {mealLabel}
                  </h4>
                  <span className="badge px-3 py-2" style={{
                    backgroundColor: currentMealColor.border,
                    color: 'white'
                  }}>
                    {mealTime.time}
                  </span>
                  {/* Nút đóng/mở bữa ăn */}
                  <button
                    className="btn btn-sm border-0 p-2 meal-toggle-btn"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: currentMealColor.text
                    }}
                    onClick={() => toggleMealExpansion(mealLabel)}
                    title={expandedMeals[mealLabel] ? 'Thu gọn' : 'Mở rộng'}
                  >
                    {expandedMeals[mealLabel] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
                <p className="mb-2" style={{ color: currentMealColor.text }}>{mealTime.tip}</p>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: currentMealColor.text }}>💡</span>
                  <small style={{ color: currentMealColor.text }}>{mealTime.advice}</small>
                </div>
              </div>

              <div className="text-end">
                <div className="fs-2 fw-bold" style={{ color: currentMealColor.text }}>{mealCalories}</div>
                <small style={{ color: currentMealColor.text }}>calories</small>
                <div className="mt-2">
                  <span className="badge" style={{
                    backgroundColor: currentMealColor.border,
                    color: 'white'
                  }}>
                    {mealCount} món
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin dinh dưỡng tổng quan - chỉ hiển thị khi mở rộng */}
            {expandedMeals[mealLabel] && (
              <div className="row g-3 mt-4">
                <div className="col-md-3">
                  <div className="text-center p-3 rounded-3" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${currentMealColor.border}`
                  }}>
                    <div className="fs-5 fw-bold" style={{ color: currentMealColor.text }}>{mealNutrition.protein}g</div>
                    <small style={{ color: currentMealColor.text }}>Protein</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 rounded-3" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${currentMealColor.border}`
                  }}>
                    <div className="fs-5 fw-bold" style={{ color: currentMealColor.text }}>{mealNutrition.carbs}g</div>
                    <small style={{ color: currentMealColor.text }}>Carbs</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 rounded-3" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${currentMealColor.border}`
                  }}>
                    <div className="fs-5 fw-bold" style={{ color: currentMealColor.text }}>{mealNutrition.fat}g</div>
                    <small style={{ color: currentMealColor.text }}>Fat</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 rounded-3" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${currentMealColor.border}`
                  }}>
                    <small className="fw-bold" style={{ color: currentMealColor.text }}>
                      {diabetesRating.text}
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách thực phẩm với thiết kế hài hòa - chỉ hiển thị khi mở rộng */}
        {expandedMeals[mealLabel] && (
          <>
            {mealFoods.length > 0 ? (
              mealFoods.map((item, idx) => (
                <div key={idx} className="bg-white rounded-3 shadow-sm border-0 p-4 mb-3 hover-lift"
                  style={{
                    transition: 'all 0.3s ease',
                    borderLeft: `4px solid ${currentMealColor.border}`
                  }}>
                  <div className="d-flex gap-4 align-items-center">
                    <div className="flex-shrink-0">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 60,
                          height: 60,
                          fontSize: 28,
                          backgroundColor: currentMealColor.bg,
                          color: currentMealColor.text,
                          border: `2px solid ${currentMealColor.border}`,
                          overflow: "hidden" // để ảnh không tràn ra ngoài
                        }}
                      >
                        <img
                          src={item.image}
                          alt="food"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover" // ảnh vừa khít vòng tròn
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-grow-1">
                      <h5 className="mb-2 fw-bold text-dark">{item.name}</h5>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <span className="badge bg-light text-dark px-3 py-2">
                          {item.details}
                        </span>
                      </div>

                      {/* Macros với thiết kế hài hòa */}
                      <div className="d-flex gap-4">
                        {item.macros.map((macro, i) => (
                          <div key={i} className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle" style={{
                                width: 12,
                                height: 12,
                                backgroundColor: getMacroColor(i)
                              }}></div>
                              <span className="fw-semibold text-dark">{macro}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center cursor-pointer ${item.checked ? 'bg-success' : 'bg-light'}`}
                        style={{
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => toggleChecked(foods.indexOf(item))}
                      >
                        {item.checked ? (
                          <Check size={18} color="white" />
                        ) : (
                          <div className="rounded-circle bg-white" style={{ width: 12, height: 12 }}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-5 rounded-3" style={{
                backgroundColor: currentMealColor.bg,
                border: `1px solid ${currentMealColor.border}`
              }}>
                <div className="mb-2" style={{ color: currentMealColor.text }}>🍽️</div>
                <small style={{ color: currentMealColor.text }}>Chưa có thực phẩm nào cho bữa {mealLabel}</small>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Hàm helper để lấy màu cho macros
  const getMacroColor = (index) => {
    const colors = ['#28a745', '#ffc107', '#dc3545'];
    return colors[index] || '#6c757d';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với HealthTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

export default FoodTrackerApp;

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
});
