import { Text } from "react-native";
import { StyleSheet, View } from "react-native";
import React from "react";

interface BlockProps {
    title: string;
    details: string;
}

const Block: React.FC<BlockProps> = ({ title, details }) => {
    return (
        <View style={styles.block}>
            <Text style={styles.innerFirstBlock}>{title}</Text>
            <Text style={styles.innerSecondBlock}>{details}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    block: {
        backgroundColor: "#522e99",
        width: "90%",
        height: "auto",
        borderRadius: 10,
        marginBottom: 10,
        color: "white",
        padding: 15,
    },
    innerFirstBlock: {
        color: "#CBA4FA",
        fontSize: 14,
    },
    innerSecondBlock: {
        color: "#E4D7F6",
        fontSize: 17,
    },
});

export default Block;