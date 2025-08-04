import {MMKVLoader} from 'react-native-mmkv-storage';

const Storage = new MMKVLoader().withEncryption().initialize();

export default Storage;
