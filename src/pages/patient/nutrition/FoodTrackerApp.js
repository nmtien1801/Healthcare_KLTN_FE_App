import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { GetListFood, updateStatusFood } from "../../../redux/foodSlice";
import { useDispatch, useSelector } from "react-redux";

const { width } = Dimensions.get("window");

// Component Stats Grid
const StatsCard = ({ stat }) => {
  const getProgressColor = (color) => {
    const colors = {
      primary: "#007bff",
      success: "#28a745",
      warning: "#ffc107",
      danger: "#dc3545",
    };
    return colors[color] || "#6c757d";
  };

  return (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>{stat.title}</Text>
        <Feather
          name={stat.trend === "up" ? "trending-up" : "trending-down"}
          size={16}
          color={stat.trend === "up" ? "#28a745" : "#dc3545"}
        />
      </View>

      <View style={styles.statsValue}>
        <Text style={styles.valueText}>
          {stat.value}
          <Text style={styles.unitText}> {stat.unit}</Text>
        </Text>
        <Text style={styles.targetText}>
          / {stat.target}
          {stat.unit}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(stat.percentage, 100)}%`,
                backgroundColor: getProgressColor(stat.color),
              },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{stat.percentage}% mục tiêu</Text>
      </View>
    </View>
  );
};

const StatsGrid = ({ foods }) => {
  const targetCalo = useSelector((state) => state.food.totalCalo);

  const calculateTotals = () => {
    let totalCalo = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    foods.forEach((food) => {
      if (food.checked) {
        const [protein, carbs, fat] = food.macros.map((m) =>
          parseFloat(m.replace("g", ""))
        );
        const cal = parseFloat(
          food.details.split("•")[1].replace("cal", "").trim()
        );

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

    foods.forEach((food) => {
      const [protein, carbs, fat] = food.macros.map((m) =>
        parseFloat(m.replace("g", ""))
      );
      const cal = parseFloat(
        food.details.split("•")[1].replace("cal", "").trim()
      );

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
      unit: "kcal",
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
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} />
      ))}
    </View>
  );
};

// Component Food Item
const FoodItem = ({ item, index, onToggle, mealColor }) => {
  const getMacroColor = (macroIndex) => {
    const colors = ["#28a745", "#ffc107", "#dc3545"];
    return colors[macroIndex] || "#6c757d";
  };

  return (
    <View style={[styles.foodItem, { borderLeftColor: mealColor.border }]}>
      <View style={styles.foodContent}>
        <View
          style={[
            styles.foodImage,
            {
              backgroundColor: mealColor.bg,
              borderColor: mealColor.border,
            },
          ]}
        >
          {item.image.startsWith("http") ? (
            <Image source={{ uri: item.image }} style={styles.foodImageInner} />
          ) : (
            <Text style={[styles.foodEmoji, { color: mealColor.text }]}>
              {item.image}
            </Text>
          )}
        </View>

        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.foodDetailsContainer}>
            <Text style={styles.foodDetails}>{item.details}</Text>
          </View>

          <View style={styles.macrosContainer}>
            {item.macros.map((macro, i) => (
              <View key={i} style={styles.macroItem}>
                <View
                  style={[
                    styles.macroDot,
                    { backgroundColor: getMacroColor(i) },
                  ]}
                />
                <Text style={styles.macroText}>{macro}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.checkButton,
            { backgroundColor: item.checked ? "#28a745" : "#f8f9fa" },
          ]}
          onPress={() => onToggle(index)}
        >
          {item.checked ? (
            <Feather name="check" size={18} color="white" />
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Component Meal Section
const MealSection = ({
  mealLabel,
  foods,
  expandedMeals,
  onToggleExpansion,
  onToggleFood,
  caloriesByMeal,
}) => {
  const getMealTime = (mealLabel) => {
    const mealTimes = {
      sáng: {
        time: "7:00 - 8:00",
        tip: "Ăn sáng trong vòng 1 giờ sau khi thức dậy",
        advice: "Bữa sáng giàu protein giúp ổn định đường huyết và no lâu",
      },
      trưa: {
        time: "12:00 - 13:00",
        tip: "Ăn trưa cách bữa sáng 4-5 giờ",
        advice: "Bữa trưa cân bằng dinh dưỡng, ưu tiên rau xanh và protein",
      },
      tối: {
        time: "18:00 - 19:00",
        tip: "Ăn tối cách giờ ngủ ít nhất 3 giờ",
        advice: "Bữa tối ít carbs, nhiều rau xanh để kiểm soát đường huyết",
      },
      "ăn vặt": {
        time: "15:00 - 16:00",
        tip: "Ăn vặt giữa bữa trưa và tối",
        advice: "Bữa phụ nhẹ nhàng, tránh thực phẩm nhiều đường",
      },
    };
    return mealTimes[mealLabel] || { time: "", tip: "", advice: "" };
  };

  const mealColors = {
    sáng: { bg: "#e3f2fd", border: "#2196f3", text: "#1565c0" },
    trưa: { bg: "#f3e5f5", border: "#9c27b0", text: "#7b1fa2" },
    tối: { bg: "#e8f5e8", border: "#4caf50", text: "#388e3c" },
    "ăn vặt": { bg: "#fff3e0", border: "#ff9800", text: "#f57c00" },
  };

  const mealTime = getMealTime(mealLabel);
  const mealFoods = foods.filter((f) => f.meal === mealLabel);
  const mealCalories = caloriesByMeal[mealLabel] || 0;
  const mealCount = mealFoods.filter((f) => f.checked).length;
  const currentMealColor = mealColors[mealLabel];

  // Tính toán dinh dưỡng cho bữa ăn này
  const mealNutrition = mealFoods.reduce(
    (acc, food) => {
      if (food.checked) {
        const [protein, carbs, fat] = food.macros.map((m) =>
          parseFloat(m.replace("g", ""))
        );
        acc.protein += protein;
        acc.carbs += carbs;
        acc.fat += fat;
      }
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  // làm tròn sau khi reduce
  mealNutrition.protein = mealNutrition.protein.toFixed(1);
  mealNutrition.carbs = mealNutrition.carbs.toFixed(1);
  mealNutrition.fat = mealNutrition.fat.toFixed(1);

  const getDiabetesRating = () => {
    if (mealNutrition.carbs > 30)
      return { text: "⚠️ Nhiều carbs - cần theo dõi đường huyết" };
    if (mealNutrition.protein > 15)
      return { text: "✅ Tốt - giàu protein ổn định đường huyết" };
    if (mealNutrition.fat > 10)
      return { text: "💡 Nhiều chất béo - no lâu nhưng cần kiểm soát" };
    return { text: "📊 Cân bằng dinh dưỡng" };
  };

  const diabetesRating = getDiabetesRating();

  return (
    <View style={styles.mealSection}>
      <View
        style={[
          styles.mealHeader,
          {
            backgroundColor: currentMealColor.bg,
            borderLeftColor: currentMealColor.border,
          },
        ]}
      >
        <View style={styles.mealHeaderContent}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealTitle, { color: currentMealColor.text }]}>
              Buổi {mealLabel}
            </Text>
            <View
              style={[
                styles.mealTimeBadge,
                { backgroundColor: currentMealColor.border },
              ]}
            >
              <Text style={styles.mealTimeText}>{mealTime.time}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.expandButton,
                { backgroundColor: "rgba(255, 255, 255, 0.2)" },
              ]}
              onPress={() => onToggleExpansion(mealLabel)}
            >
              <Feather
                name={expandedMeals[mealLabel] ? "chevron-up" : "chevron-down"}
                size={16}
                color={currentMealColor.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.mealTip, { color: currentMealColor.text }]}>
            {mealTime.tip}
          </Text>

          <View style={styles.mealAdviceRow}>
            <Text
              style={[styles.mealAdviceIcon, { color: currentMealColor.text }]}
            >
              💡
            </Text>
            <Text style={[styles.mealAdvice, { color: currentMealColor.text }]}>
              {mealTime.advice}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <View style={styles.nutritionGrid}>
            <View
              style={[
                styles.nutritionCard,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderColor: currentMealColor.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.nutritionValue,
                  { color: currentMealColor.text },
                ]}
              >
                {mealNutrition.protein}g
              </Text>
              <Text
                style={[
                  styles.nutritionLabel,
                  { color: currentMealColor.text },
                ]}
              >
                Protein
              </Text>
            </View>

            <View
              style={[
                styles.nutritionCard,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderColor: currentMealColor.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.nutritionValue,
                  { color: currentMealColor.text },
                ]}
              >
                {mealNutrition.carbs}g
              </Text>
              <Text
                style={[
                  styles.nutritionLabel,
                  { color: currentMealColor.text },
                ]}
              >
                Carbs
              </Text>
            </View>

            <View
              style={[
                styles.nutritionCard,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderColor: currentMealColor.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.nutritionValue,
                  { color: currentMealColor.text },
                ]}
              >
                {mealNutrition.fat}g
              </Text>
              <Text
                style={[
                  styles.nutritionLabel,
                  { color: currentMealColor.text },
                ]}
              >
                Fat
              </Text>
            </View>
          </View>

          <View style={styles.mealStats}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "",
              }}
            >
              <Text
                style={[styles.mealCalories, { color: currentMealColor.text }]}
              >
                {mealCalories}
              </Text>
              <Text
                style={[
                  styles.mealCaloriesLabel,
                  { color: currentMealColor.text },
                ]}
              >
                calories
              </Text>
            </View>

            <View
              style={[
                styles.mealCountBadge,
                { backgroundColor: currentMealColor.border },
              ]}
            >
              <Text style={styles.mealCountText}>{mealCount} món</Text>
            </View>
          </View>
        </View>
      </View>

      {expandedMeals[mealLabel] && (
        <>
          <View
            style={[
              styles.diabetesRatingCard,
              {
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderColor: currentMealColor.border,
                marginBottom: 12,
              },
            ]}
          >
            <Text
              style={[styles.diabetesRating, { color: currentMealColor.text }]}
            >
              {diabetesRating.text}
            </Text>
          </View>

          {mealFoods.length > 0 ? (
            mealFoods.map((item, idx) => (
              <FoodItem
                key={idx}
                item={item}
                index={foods.indexOf(item)}
                onToggle={onToggleFood}
                mealColor={currentMealColor}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyMeal,
                {
                  backgroundColor: currentMealColor.bg,
                  borderColor: currentMealColor.border,
                },
              ]}
            >
              <Text
                style={[styles.emptyMealIcon, { color: currentMealColor.text }]}
              >
                🍽️
              </Text>
              <Text
                style={[styles.emptyMealText, { color: currentMealColor.text }]}
              >
                Chưa có thực phẩm nào cho bữa {mealLabel}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Main Component
export default function FoodTrackerApp() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [foods, setFoods] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState({
    sáng: true,
    trưa: true,
    tối: true,
    "ăn vặt": true,
  });

  // Hàm phân bổ thực phẩm vào bữa ăn hợp lý cho bệnh nhân tiểu đường
  const assignMealsToFoods = (foodItems) => {
    const meals = ["sáng", "trưa", "tối", "ăn vặt"];
    const mealPreferences = {
      sáng: { protein: 0.3, carbs: 0.25, fat: 0.2 },
      trưa: { protein: 0.25, carbs: 0.3, fat: 0.25 },
      tối: { protein: 0.2, carbs: 0.2, fat: 0.3 },
      "ăn vặt": { protein: 0.25, carbs: 0.25, fat: 0.25 },
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
        meals.forEach((meal) => {
          const pref = mealPreferences[meal];
          const score =
            Math.abs(proteinRatio - pref.protein) +
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
    const fetchFood = async () => {
      let food = await dispatch(GetListFood(user.userId));

      if (food && food.payload.DT.length > 0) {
        let data = food.payload.DT;
        const mappedFoods = data.map((food) => ({
          id: food?._id,
          image: food.image ?? "🍅",
          name: food.name,
          details: `${food.weight}g • ${food.calo}cal`,
          macros: [
            `${food.chat_dam}g`,
            `${food.duong_bot}g`,
            `${food.chat_beo}g`,
          ],
          colors: ["success", "warning", "danger"],
          checked: food.checked || false,
          meal: "sáng",
        }));

        // Phân bổ thực phẩm vào bữa ăn hợp lý
        const foodsWithMeals = assignMealsToFoods(mappedFoods);

        setFoods(foodsWithMeals);
      }
    };

    fetchFood();
  }, []);

  const toggleChecked = async (index) => {
    const updatedFoods = [...foods];
    updatedFoods[index].checked = !updatedFoods[index].checked;
    setFoods(updatedFoods);

    await dispatch(
      updateStatusFood({
        id: updatedFoods[index].id,
        checked: updatedFoods[index].checked,
      })
    );
  };

  const toggleMealExpansion = (mealLabel) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealLabel]: !prev[mealLabel],
    }));
  };

  const caloriesByMeal = foods.reduce((result, food) => {
    if (food.checked) {
      const cal = parseFloat(
        food.details.split("•")[1].replace("cal", "").trim()
      );
      result[food.meal] = (result[food.meal] || 0) + cal;
    }
    return result;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            🍽️ Theo dõi Dinh dưỡng Hàng ngày
          </Text>
          <Text style={styles.headerSubtitle}>
            Quản lý chế độ ăn uống khoa học cho bệnh nhân tiểu đường
          </Text>
        </View>

        <StatsGrid foods={foods} />

        <MealSection
          mealLabel="sáng"
          foods={foods}
          expandedMeals={expandedMeals}
          onToggleExpansion={toggleMealExpansion}
          onToggleFood={toggleChecked}
          caloriesByMeal={caloriesByMeal}
        />

        <MealSection
          mealLabel="trưa"
          foods={foods}
          expandedMeals={expandedMeals}
          onToggleExpansion={toggleMealExpansion}
          onToggleFood={toggleChecked}
          caloriesByMeal={caloriesByMeal}
        />

        <MealSection
          mealLabel="tối"
          foods={foods}
          expandedMeals={expandedMeals}
          onToggleExpansion={toggleMealExpansion}
          onToggleFood={toggleChecked}
          caloriesByMeal={caloriesByMeal}
        />

        <MealSection
          mealLabel="ăn vặt"
          foods={foods}
          expandedMeals={expandedMeals}
          onToggleExpansion={toggleMealExpansion}
          onToggleFood={toggleChecked}
          caloriesByMeal={caloriesByMeal}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 22,
  },

  // Stats Grid Styles
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsCard: {
    width: (width - 48) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    flex: 1,
  },
  statsValue: {
    marginBottom: 12,
  },
  valueText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
  },
  unitText: {
    fontSize: 14,
    color: "#6c757d",
  },
  targetText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBg: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 11,
    color: "#6c757d",
  },

  // Meal Section Styles
  mealSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  mealHeader: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  mealHeaderContent: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  mealTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  mealTimeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mealTip: {
    fontSize: 14,
    marginBottom: 8,
  },
  mealAdviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mealAdviceIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  mealAdvice: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  mealStats: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 80,
  },
  mealCalories: {
    fontSize: 32,
    fontWeight: "bold",
  },
  mealCaloriesLabel: {
    fontSize: 12,
    marginLeft: 3,
  },
  mealCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  mealCountText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },

  // Nutrition Grid
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  nutritionCard: {
    width: (width - 500) / 2,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  diabetesRatingCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
  },
  diabetesRating: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },

  // Food Item Styles
  foodItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  foodContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginRight: 16,
    overflow: "hidden",
  },
  foodImageInner: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  foodEmoji: {
    fontSize: 28,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  foodDetailsContainer: {
    marginBottom: 12,
  },
  foodDetails: {
    backgroundColor: "#f8f9fa",
    color: "#495057",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  macrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  macroText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  uncheckedCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },

  // Empty Meal Styles
  emptyMeal: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyMealIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyMealText: {
    fontSize: 14,
    textAlign: "center",
  },

  bottomSpacing: {
    height: 20,
  },
});
