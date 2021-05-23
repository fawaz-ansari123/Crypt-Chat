import AutoScrollFlatList from "react-native-autoscroll-flatlist";
import KeyboardSpacer from "react-native-keyboard-spacer";
import { Audio } from "expo-av";
import { Dialogflow_V2 } from "react-native-dialogflow";
import { dialogflowConfig } from "../env";
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location';

import React, { Component, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  FlatList,
  Button,
  RefreshControl,
  AppState,
} from "react-native";
import Spinner from "react-native-loading-spinner-overlay";

const { baseUrl } = require("../config/dev-config.json");
import axios from "axios";
import { getIdToken, encryptData, decryptData } from "../commons/index";
import firebase from "../config/firebase";
import moment from "moment";
import { SafeAreaView } from "react-native-safe-area-context";
import { encrypt, decrypt } from "react-native-simple-encryption";

axios.defaults.withCredentials = true;

// const io = require("socket.io-client");
// const socket = io(baseUrl, { forceNode: true });

export default function Chat({ navigation }) {
  const { contact, socket } = navigation.state.params;
  const flatList = React.useRef(null);

  const [spinner, setSpinner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [welcomeText, setWelcomeText] = useState();
  // console.log(ciphertext);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [sendloc, setSendloc] = useState(false)
  const botWelcome = {
    id: 8,
    date: "9:50 am",
    type: "in",
    message:
      "Hi! I am the emergency bot from safeAlert.\n\nHow may I help you today?",
  };

  const [data, setData] = useState([]);

  const [message, setMessage] = useState("");
  const renderDate = (date) => {
    return <Text style={styles.time}>{date}</Text>;
  };

  // when the socket connect with the chat
  const playSound = async (option) => {
    if (option == "RCV") {
      try {
        const messageRcv = new Audio.Sound();

        await messageRcv.loadAsync(require("../assets/sounds/send_tone2.mp3"));

        await messageRcv.playAsync();
        // Your sound is playing!
      } catch (error) {
        console.log("error while playing audio", error);
      }
    } else {
      try {
        const messageSend = new Audio.Sound();

        await messageSend.loadAsync(
          require("../assets/sounds/message-received.mp3")
        );

        await messageSend.playAsync();
        // Your sound is playing!
      } catch (error) {
        console.log("error while playing audio", error);
      }
    }
  };
  
  const handleSubmit = () => {
    getIdToken().then((token) => {
      axios.defaults.headers.common["Authorization"] = token;
      //encrypt

      console.log(typeof ciphertext);
      axios
        .post(baseUrl + "/secured/postmessage", {
          message: encryptData(message),
          receiverId: contact._id,
        })
        .then(({ data }) => {})
        .catch((err) => {
          console.log("post message mn error aa gaya", err);
          throw err;
        });
    });
    Dialogflow_V2.requestQuery(
      message,
      (result) => botResponse(result),
      (error) => console.log(error)
    );
    setData((previousData) => [
      ...previousData,
      {
        id: Math.floor(Math.random(10000) * Math.floor(10000)),
        date: moment(moment.utc().toDate()).format("DD/MM/YYYY hh:mm a"),
        type: "out",
        message: message,
      },
    ]);
    playSound("Send");
    setMessage("");
  };
  const getMessages = () => {
    getIdToken().then((token) => {
      axios.defaults.headers.common["Authorization"] = token;
      axios
        .get(baseUrl + `/secured/getmessages?partnerId=${contact._id}`)
        .then(({ data }) => {
          const result = data.result;
          // console.log(result);
          for (i = 0; i < result.length; i++) {
            // console.log(result[i]);
            const body = {
              id: result[i]._id,
              message: decryptData(result[i].message),
              type: result[i].currentUserIsSender ? "out" : "in",
              date: moment(result[i].dateTime).format("DD/MM/YYYY hh:mm a"),
            };

            setData((oldMessages) => [...oldMessages, body]);
          }
          setSpinner(false);
          setData((oldMessages) => [...oldMessages, botWelcome]);
        })
        .catch((err) => {
          console.log("yhi par error aa gaya", err);
          throw err;
        });
    });
  };

  //on every component did mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
    AppState.addEventListener("change", _handleAppStateChange);
    Dialogflow_V2.setConfiguration(
      dialogflowConfig.client_email,
      dialogflowConfig.private_key,
      Dialogflow_V2.LANG_ENGLISH_US,
      dialogflowConfig.project_id
    );
    setSpinner(true);

    let isSubscribed = true;
    console.log("in Chat is ", socket.id);
    socket.on("newMessage", ({ msgBody, sender }) => {
      const body = {
        id: msgBody._id,
        message: decryptData(msgBody.message),
        type: msgBody.currentUserIsSender ? "out" : "in",
        date: moment(msgBody.dateTime).format("DD/MM/YYYY hh:mm a"),
      };
      if (isSubscribed) setData((oldMessages) => [...oldMessages, body]);
      playSound("RCV");
    });
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (isSubscribed) {
          getMessages();
        }
      }
    });

    return () => {
      AppState.removeEventListener("change", _handleAppStateChange);
      isSubscribed = false;
    };
  }, []);

  const botResponse = (resultFromDF) => {
    const body = {
      id: data.length + 1,
      message: resultFromDF.queryResult.fulfillmentMessages[0].text.text[0],
      type: "in",
      date: moment().format("DD/MM/YYYY hh:mm a"),
    };
    setData((oldMessages) => [...oldMessages, body]);
    playSound("RCV");
  };

  const getcurrent_location = () => {
    setSendloc(true)
    getIdToken().then((token) => {
      axios.defaults.headers.common["Authorization"] = token;
      //encrypt

      console.log(typeof ciphertext);
      axios
        .post(baseUrl + "/secured/postmessage", {
          message: encryptData(message),
          receiverId: contact._id,
        })
        .then(({ data }) => {})
        .catch((err) => {
          console.log("post message mn error aa gaya", err);
          throw err;
        });
    });
    setData((previousData) => [
      ...previousData,
      {
        id: Math.floor(Math.random(10000) * Math.floor(10000)),
        date: moment(moment.utc().toDate()).format("DD/MM/YYYY hh:mm a"),
        type: "out",
        message: location,
      },
    ]);
    playSound("Send");
    setMessage("");
  }



  const _handleAppStateChange = (nextAppState) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log(nextAppState);
        if (nextAppState == "active") {
          console.log("in Chat socket id is", socket.id);
        }
        if (nextAppState == "background") {
          socket.emit("leaveRoom", {
            uid: user.uid,
          });
        }
        console.log(socket.id);
      }
    });
  };
  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }
  

  // pull to refresh component
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getContact();

    wait(2000).then(() => setRefreshing(false));
  }, [refreshing]);
  return (
    <SafeAreaView style={styles.container}>
      <Spinner
        visible={spinner}
        textContent={"Loading..."}
        textStyle={styles.spinnerTextStyle}
        animation="slide"
      />
      <FlatList
        ref={flatList}
        style={styles.list}
        data={data}
        onContentSizeChange={() => {
          flatList.current.scrollToEnd();
        }}
        keyExtractor={(item) => {
          return item.id.toString();
        }}
        renderItem={(message) => {
          const item = message.item;
          // console.log(item);
          let inMessage = item.type === "in";
          let itemStyle = inMessage ? styles.itemIn : styles.itemOut;
          return (
            item.message.coords?(
              <View style={styles.map}>
                  <View  style={styles.item}>
                    <View style={[styles.balloon]}>
                  <MapView
                  style={styles.map}
                  initialRegion={{latitude:item.message.coords.latitude,
                                  longitude: item.message.coords.longitude,
                                  latitudeDelta: 0.001,
                                  longitudeDelta: 0.001
                  }}
                  showsUserLocation={true}
                  >
                    <MapView.Marker
                    coordinate={{ "latitude": item.message.coords.latitude,   
                    "longitude": item.message.coords.longitude }}
                    title={"Patient's Current Location"}
                    draggable />
                  </MapView>
                  </View>
                  </View>
              </View>
            ):(
            <View>
              <View style={[styles.item, itemStyle]}>
                {/* {!inMessage && renderDate(item.date)} */}
                <View style={[styles.balloon]}>
                  <Text>{item.message}</Text>
                </View>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <Text> {renderDate(item.date)}</Text>
              </View>
            </View>)
          );
        }}
      />
      <View style={styles.footer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputs}
            placeholder="Write a message..."
            underlineColorAndroid="transparent"
            onChangeText={(message) => setMessage(message)}
            defaultValue={message}
          />
        </View>

        <TouchableOpacity style={styles.btnSend} onPress={() => handleSubmit()}>
          <Image
            source={{
              uri: "https://img.icons8.com/color/48/000000/filled-sent.png",
            }}
            style={styles.iconSend}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSend} onPress= {getcurrent_location}>
          <Image
            source={{
              uri: "https://img.icons8.com/material/24/000000/worldwide-location--v1.png"
            }}
            style={styles.iconSend}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map :{
    width:400,
    height:200
  },
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 17,
  },
  footer: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#eeeeee",
    paddingHorizontal: 10,
    padding: 5,
  },
  btnSend: {
    backgroundColor: "#00BFFF",
    width: 40,
    height: 40,
    borderRadius: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSend: {
    width: 30,
    height: 30,
    alignSelf: "center",
  },
  inputContainer: {
    borderBottomColor: "#F5FCFF",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderBottomWidth: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  inputs: {
    height: 40,
    marginLeft: 16,
    borderBottomColor: "#FFFFFF",
    flex: 1,
  },
  balloon: {
    maxWidth: 250,
    padding: 15,
    borderRadius: 20,
  },
  itemIn: {
    alignSelf: "flex-start",
  },
  itemOut: {
    alignSelf: "flex-end",
    backgroundColor: "#00868B",
  },
  time: {
    alignSelf: "flex-end",
    margin: 15,
    fontSize: 12,
    color: "#808080",
  },
  item: {
    marginVertical: 14,
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#eeeeee",
    borderRadius: 300,
    padding: 5,
  },
});
