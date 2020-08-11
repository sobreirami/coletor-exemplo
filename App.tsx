import React, {useState, useCallback, useEffect, useRef} from 'react';

import {readFile} from 'react-native-fs';

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  StatusBar,
  Button,
  Text,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';

import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-community/async-storage';

import {Colors} from 'react-native/Libraries/NewAppScreen';

declare const global: {HermesInternal: null | {}};

interface Product {
  id: string;
  ean: string;
  description: string;
  manufacturer: string;
  quantity: number;
}

const App = () => {
  const eanInputRef = useRef<TextInput>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsSelected, setProductsSelected] = useState<Product[]>([]);

  useEffect(() => {
    async function loadStoragedData(): Promise<void> {
      const localProducts = await AsyncStorage.getItem('@coletor:products');

      if (localProducts) {
        setProducts(JSON.parse(localProducts));
      }
    }

    loadStoragedData();
  }, []);

  const handleUploadCSVProducts = useCallback(async () => {
    // Pick a single file
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const csvFilePath = await readFile(res.uri, 'utf8');

      const parseProducts = csvFilePath.split(/\r\n|\n|\r/).map((row) => {
        const [id, ean, description, manufacturer, quantity] = row
          .split(',')
          .map((p) => {
            return p.replace(/"/g, '');
          });

        return {
          id,
          ean,
          description,
          manufacturer,
          quantity,
        };
      });

      await AsyncStorage.setItem(
        '@coletor:products',
        JSON.stringify(parseProducts),
      );

      setProducts(parseProducts);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  }, []);

  const handleChangeInput = useCallback(
    async (ean) => {
      const productIndex = products.findIndex((p) => p.ean === ean);

      if (productIndex < 0) {
        Alert.alert('Produto não localizado');
        eanInputRef.current?.focus();
        return;
      }

      const product = products[productIndex];

      setProductsSelected([...productsSelected, product]);
      eanInputRef.current?.focus();
    },
    [products, productsSelected],
  );

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Button onPress={handleUploadCSVProducts} title="Carregar arquivo" />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Text>Produtos carregados: {products.length}</Text>

          <TextInput
            ref={eanInputRef}
            placeholder="EAN"
            onSubmitEditing={(event) =>
              handleChangeInput(event.nativeEvent.text)
            }
          />

          <FlatList
            keyExtractor={(product) => product.id}
            ListHeaderComponent={<Text>Produtos escaneados</Text>}
            data={productsSelected}
            renderItem={({item: product}) => <Text>{product.description}</Text>}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
