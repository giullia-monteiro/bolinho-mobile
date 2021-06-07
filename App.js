import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, TextInput, Picker, Alert } from 'react-native';
import { NavigationContainer, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'
import axios from 'axios'

import BolinhoLogo from './assets/bolinho.png'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

//-------
//-------
//-------NAVIGATION
export default function App() {
  // props propagation
  const [jwt, setJWT] = useState({ token: null })

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {() => <HomeScreen setJWT={setJWT} />}
        </Stack.Screen>
        <Stack.Screen name="AppTabs">
          {() => <AppTabs setJWT={setJWT} jwt={jwt} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const AppTabs = ({ jwt, setJWT }) => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Clientes">
        {() => <ClientesTab jwt={jwt} setJWT={setJWT} />}
      </Tab.Screen>
      <Tab.Screen name="Pedidos" >
        {() => <ListarPedidosScreen jwt={jwt} setJWT={setJWT} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

const ClientesTab = ({ jwt, setJWT }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Listar">
        {() => <ListarClientesScreen jwt={jwt} setJWT={setJWT} />}
      </Stack.Screen>
      <Stack.Screen name="Cadastrar">
        {() => <CadastrarClienteScreen jwt={jwt} />}
      </Stack.Screen>
      <Stack.Screen name="Editar">
        {() => <CadastrarClienteScreen jwt={jwt} />}
      </Stack.Screen>
      <Stack.Screen name="CadastrarPedido">
        {() => <CadastrarPedidoScreen jwt={jwt} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
//-------NAVIGATION
//-------
//-------

//------
//------
//------ SCREENS
const HomeScreen = ({ setJWT }) => {

  const navigation = useNavigation();

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const validations = () => {
    const errors = []

    if (email.trim() == "")
      errors.push('Email vazio')

    else if (!RegExp(/^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i).test(email))
      errors.push('\nEmail inválido')

    else if (senha.trim() == "")
      errors.push('\nSenha vazia')

    return [errors.length === 0, errors]
  }

  const login = () => {
    const [validation, errors] = validations()

    if (!validation) {
      Alert.alert('Login Inválido', errors.toString())
      return
    }


    Backend
      .getLogin(email, senha)
      .then(res => {
        if (res.data.token) {

          setJWT({ token: res.data.token })

          navigation.dispatch(StackActions.replace('AppTabs'))
        }
        else {
          Alert.alert('Login Inválido', `Não foi possivel fazer a autenticação para o email: ${email}!`)
        }
      })
      .catch(err => {
        console.log(err)
        const responseData = err.response.data

        if (!responseData.email) {
          Alert.alert('Login Inválido', `O usuário com o email: ${email} não está cadastrado!`)
          return
        }

        if (!responseData.senha) {
          Alert.alert('Login Inválido', `Sua senha está errada!`)
          return
        }
      })

  }

  return (
    <View style={styles.container}>
      <Image source={BolinhoLogo} style={styles.homeImage} />
      <View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={val => setEmail(val)}
            keyboardType='email-address'
          />
        </View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={val => setSenha(val)}
            secureTextEntry
          />
        </View>
      </View>
      <TouchableOpacity
        style={{ ...styles.button, ...styles.homeButton }}
        activeOpacity={.7}
        onPress={() => login()}
      >
        <Text style={styles.buttonText}> ENTRAR </Text>
      </TouchableOpacity>
    </View>
  )
}




//------CLIENTE

const ListarClientesScreen = ({ jwt, setJWT }) => {
  const navigation = useNavigation();

  const [clientes, setClientes] = useState([])
  const [load, setLoading] = useState(false)

  useEffect(() => getClientes(), [])

  const getClientes = () => {

    Backend
      .getClientes(jwt.token).then(res => {
        setClientes(res.data)
        setLoading(true)
      })
      .catch(err => Alert.alert('Erro ao carregar', err))

  }

  const atualizar = () => {
    setLoading(false)
    getClientes()
  }

  const logout = () => {
    setJWT({ token: null })
    navigation.dispatch(StackActions.replace('Home'))
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Clientes</Text>
      <View style={styles.listarContainer}>
        {
          load
            ?
            Object.values(clientes).map((cliente, i) => (
              <CardCliente
                key={i.toString() + cliente.id.toString()}
                cliente={cliente}
                jwt={jwt}
                atualizaLista={atualizar}
              />
            ))
            :
            <Text style={styles.tituloCard}>Carregando...</Text>
        }
      </View>

      <TouchableOpacity
        style={{
          ...styles.button,
          ...styles.cadastrarButton
        }}
        activeOpacity={.7}
        onPress={() => navigation.navigate('Cadastrar', {})}
      >
        <Text style={styles.buttonText}> CADASTRAR CLIENTE </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          ...styles.button,
          ...styles.atualizarButton
        }}
        activeOpacity={.7}
        onPress={() => atualizar()}
      >
        <Text style={styles.buttonText}> ATUALIZAR LISTA </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          ...styles.button,
          ...styles.cadastrarButton
        }}
        activeOpacity={.7}
        onPress={() => logout()}
      >
        <Text style={styles.buttonText}> SAIR DO APP </Text>
      </TouchableOpacity>
    </View>
  )
}

const CardCliente = ({ cliente, jwt }) => {

  const navigation = useNavigation()

  const [countPedidos, setCountPedidos] = useState(0)

  useEffect(() => {
    Backend
      .getClientePedidos(cliente.id, jwt.token)
      .then(res => setCountPedidos(res.data.length))
      .catch(err => { })
  }, [])

  const excluir = () => {
    Alert.alert(
      'Excuir cliente?',
      `Deseja exluir o cliente ${cliente.nome}`,
      [
        {
          text: "SIM",
          onPress: () => {
            Backend
              .deleteCliente(cliente.id, jwt.token)
              .catch(err => { })
          }
        },
        { text: "NÃO", onPress: () => { } }
      ]
    )
  }


  return (
    <View style={styles.card}>
      <Text style={styles.tituloCard}>{`${cliente.nome}`}</Text>
      <Text>{`Idade: ${cliente.idade}`}</Text>
      <Text>{`Pedidos: ${countPedidos}`}</Text>
      <View style={styles.cardButtonsContainer}>
        <TouchableOpacity
          style={{ ...styles.button, width: '45%' }}
          activeOpacity={.7}
          onPress={() => excluir()}
        >
          <Text style={styles.buttonText}> Excluir </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.button, width: '45%' }}
          activeOpacity={.7}
          onPress={() => navigation.navigate('Editar', { id: cliente.id })}
        >
          <Text style={styles.buttonText}> Editar </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={{ ...styles.button, width: '100%', marginTop: 8 }}
        activeOpacity={.7}
        onPress={() => navigation.navigate('CadastrarPedido', { cliente })}
      >
        <Text style={styles.buttonText}> Realizar Pedido </Text>
      </TouchableOpacity>
    </View>
  )
}

const CadastrarClienteScreen = ({ jwt }) => {

  const { id } = useRoute().params

  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')

  useEffect(() => {
    if (id) {
      Backend
        .getCliente(id, jwt.token).then(res => {
          setNome(res.data.nome)
          setIdade(res.data.idade.toString())
        })
    }
  }, [])

  const validations = () => {
    const errors = []

    if (nome.trim() == "" && nome.length < 4)
      errors.push('Nome invalido')

    else if (nome.split(" ").length < 2)
      errors.push('\nVoce deve colocar nome e sobre nome')

    else if (idade.trim() == "" || idade.length > 2)
      errors.push('\nIdade invalida ')

    return [errors.length === 0, errors]
  }

  const sendCliente = () => {
    const [validation, errors] = validations()

    if (!validation) {
      Alert.alert('Cadastro Inválido', errors.toString())
      return
    }

    (
      !id
        ?
        Backend.postCliente(nome, idade, jwt.token)
        :
        Backend.putCliente(id, nome, idade, jwt.token)
    )
    .then(_ => {
      Alert.alert('Cliente enviado', `O Cliente ${nome} foi enviado!`)
    })
    .catch(err => {
      console.log(err)
      Alert.alert('Erro ao enviar o cliente', `Não foi possivel enviar o cliente no banco de dados`)
    })
  }


  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>
        { (!id ? "Cadastrar" : "Editar") + " cliente" }
      </Text>
      <View style={styles.cadastrarForm}>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={val => setNome(val)}
          />
        </View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Idade</Text>
          <TextInput
            style={styles.input}
            value={idade}
            onChangeText={val => setIdade(val)}
            keyboardType='number-pad'
          />
        </View>
      </View>
      <TouchableOpacity
        style={{
          ...styles.button,
          ...styles.cadastrarButton
        }}
        activeOpacity={.7}
        onPress={() => sendCliente()}
      >
        <Text style={styles.buttonText}> 
          { !id ? "CADASTRAR" : "EDITAR" } 
        </Text>
      </TouchableOpacity>
    </View>
  )
}
//------CLIENTE

//-----PEDIDOS
const CadastrarPedidoScreen = ({ jwt }) => {

  const { cliente } = useRoute().params

  const tamanhos = {
    PEQUENO: 'PEQUENO',
    MEDIO: 'MEDIO',
    GRANDE: 'GRANDE'
  }

  const [sabor, setSabor]           = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [tamanho, setTamanho]       = useState(tamanhos.PEQUENO)

  const validations = () => {
    const errors = []

    if (sabor.trim() == "" && cliente.length < 4)
      errors.push('\nSabor invalido ')

    if (quantidade.trim() == "" && typeof quantidade != 'number')
      errors.push('\nQuantidade invalida')


    return [errors.length === 0, errors]
  }

  const cadastrar = () => {
    const [validation, errors] = validations()

    if (!validation) {
      Alert.alert('Cadastro Inválido', errors.toString())
      return
    }

    Backend
      .postPedido(cliente.id, sabor, quantidade, tamanho, jwt.token)
      .then(_ => {
        Alert.alert('Pedido Cadastrado com sucesso', `O bolo do ${cliente.nome} foi cadastrado!!`)
      })
      .catch(err => {
        console.log(err)
        Alert.alert('Erro ao cadastra o Pedido', `Não foi possivel cadastrar o pedido no banco de dados`)
      })

  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Cadastrar Pedido</Text>
      <View style={styles.cadastrarForm}>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Cliente</Text>
          <Text style={styles.autoCompleteLabel}>{cliente.nome}</Text>
        </View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Sabor</Text>
          <TextInput
            style={styles.input}
            value={sabor}
            onChangeText={val => setSabor(val)}
          />
        </View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel} >Quantidade</Text>
          <TextInput
            style={styles.input}
            value={quantidade}
            keyboardType='number-pad'
            onChangeText={val => setQuantidade(val)}
          />
        </View>
        <View style={styles.inputView}>
          <Text style={styles.inputLabel}>Tamanho</Text>
          <Picker
            selectedValue={tamanho}
            onValueChange={val => setTamanho(val)}
          >
            {Object.values(tamanhos).map((val, i) => (
              <Picker.Item key={i + val} label={val} value={val} />
            ))}
          </Picker>
        </View>
      </View>
      <TouchableOpacity
        style={{ ...styles.button, ...styles.cadastrarButton }}
        activeOpacity={.7}
        onPress={() => cadastrar()}
      >
        <Text style={styles.buttonText}> CADASTRAR </Text>
      </TouchableOpacity>
    </View>
  )
}

const ListarPedidosScreen = ({ jwt }) => {

  const [pedidos, setPedidos] = useState([])
  const [load, setLoading] = useState(false)

  useEffect(() => getPedidos(), [])

  const getPedidos = () => {

    Backend
      .getPedidos(jwt.token).then(res => {
        setPedidos(res.data)
        setLoading(true)
        console.log(res.data)
      })
      .catch(err => Alert.alert('Erro ao carregar', err))
  }

  const atualizar = () => {
    setLoading(false)
    getPedidos()
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Pedidos</Text>
      <View style={styles.listarContainer}>
        {
          load
            ?
            Object.values(pedidos).map((pedido, i) => (
              <CardPedido
                key={i.toString() + pedido.id.toString()}
                pedido={pedido}
                jwt={jwt}
                atualizarLista={atualizar}
              />
            ))
            :
            <Text style={styles.tituloCard}>Carregando...</Text>
        }
      </View>

      <TouchableOpacity
        style={{
          ...styles.button,
          ...styles.atualizarButton
        }}
        activeOpacity={.7}
        onPress={() => atualizar()}
      >
        <Text style={styles.buttonText}> ATUALIZAR LISTA </Text>
      </TouchableOpacity>
    </View>
  )
}

const CardPedido = ({ pedido, jwt, atualizarLista }) => {

  const [nomeCliente, setNomeCliete] = useState('')

  useEffect(() => {
    Backend.getCliente(pedido.clienteid, jwt.token)
      .then(res => setNomeCliete(res.data.nome))
      .catch(err => { })
  }, [])

  const excluir = () => {
    Alert.alert(
      'Excuir Pedido?',
      `Deseja exluir o pedido do ${nomeCliente}`,
      [
        {
          text: "SIM",
          onPress: () => {
            Backend
              .deltePedido(pedido.id, jwt.token)
              .then(_ => atualizarLista())
              .catch(err => { })
          }
        },
        { text: "NÃO", onPress: () => { } }
      ]
    )
  }

  const aceitarPedido = () => {
    Backend.changeStatusPedido(pedido.id, 1, jwt.token).then(_ => {
      atualizarLista()
    })
  }

  const dataDoPedido =  new Date(pedido.data * 1000).toLocaleDateString("pt-BR")
                        + " - "
                        + new Date(pedido.data * 1000).toLocaleTimeString("pt-BR")

  return (
    <View style={styles.card}>
      <Text style={styles.tituloCard}>{`Pedido: ${pedido.id}`}</Text>
      <Text>
        {`Cliente: ${nomeCliente}`}
      </Text>
      <Text>
        {`Sabor: ${pedido.sabor}`}
      </Text>
      <Text>
        {`Quantidade: ${pedido.quantidade}`}
      </Text>
      <Text>
        {`Tamanho: ${pedido.tamanho}`}
      </Text>
      <Text>
        {`Data: ${dataDoPedido}`}
      </Text>
      <Text>
        {`Status: ${pedido.status === 1 ? "ACEITO" : "PENDENTE"}`}
      </Text>
      <View style={styles.cardButtonsContainer}>

        <TouchableOpacity
          style={{ ...styles.button, width: '45%' }}
          activeOpacity={.7}
          onPress={() => excluir()}
        >
          <Text style={styles.buttonText}> Excluir </Text>
        </TouchableOpacity>

        {
          pedido.status !== 1
            ?
            <TouchableOpacity
              style={{ ...styles.button, width: '45%' }}
              activeOpacity={.7}
              onPress={() => aceitarPedido()}
            >
              <Text style={styles.buttonText}> Aceitar </Text>
            </TouchableOpacity>
            :
            <></>
        }
      </View>
    </View>
  )
}
//-----PEDIDOS
//------ SCREENS
//------
//------


//-----
//-----
//-----Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24
  },
  tabContainer: {
    flex: 1,
    display: 'flex',
    backgroundColor: '#fff',
    paddingTop: 54,
    paddingHorizontal: 24
  },
  tabTitle: {
    fontSize: 24,
    color: '#f1485cff',
    fontWeight: 'bold'
  },
  homeImage: {
    height: 195,
    width: 192,
    alignSelf: 'center'
  },
  homeButton: {
    top: 80,
    padding: 2,
    alignSelf: 'center'
  },
  button: {
    width: 192,
    backgroundColor: '#f1485c',
    borderRadius: 192 / 2,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white'
  },
  cadastrarForm: {
    flex: 1
  },
  cadastrarButton: {
    alignSelf: 'center',
    marginBottom: 32
  },
  atualizarButton: {
    alignSelf: 'center',
    marginBottom: 32
  },
  inputView: {
    width: '100%',
    marginTop: 8
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  input: {
    fontSize: 14,
    backgroundColor: '#f4f0f0',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8
  },
  listarContainer: {
    flex: 1
  },
  card: {
    backgroundColor: '#f4f0f0',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginTop: 8,
    paddingVertical: 12
  },
  tituloCard: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1485cff',
    marginBottom: 8
  },
  cardButtonsContainer: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  autoCompleteLabel: {
    fontSize: 16,
    marginBottom: 8,
  }
})


//-----
//-----
//-----Backend calls
const baseURL = 'https://bolinho-backend.herokuapp.com'

const Backend = {
  getLogin: async (email, senha) => {
    return await axios({
      url: `${baseURL}/login`,
      method: 'POST',
      data: { email, senha }
    })
  },
  getClientes: async (token) => {
    return await axios({
      url: `${baseURL}/clientes`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  getClientePedidos: async (id, token) => {
    return await axios({
      url: `${baseURL}/clientes/${id}/pedidos`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  deleteCliente: async (id, token) => {
    return await axios({
      url: `${baseURL}/clientes`,
      method: 'DELETE',
      data: { id },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  postCliente: async (nome, idade, token) => {
    return await axios({
      url: `${baseURL}/clientes`,
      method: 'POST',
      data: { nome, idade },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  putCliente: async (id, nome, idade, token) => {
    return await axios({
      url: `${baseURL}/clientes`,
      method: 'PUT',
      data: { id, nome, idade },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  getCliente: async (id, token) => {
    return await axios({
      url: `${baseURL}/clientes/${id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  postPedido: async (clienteId, sabor, quantidade, tamanho, token) => {
    return await axios({
      url: `${baseURL}/pedidos`,
      method: 'POST',
      data: { clienteId, sabor, quantidade, tamanho },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  getPedidos: async (token) => {
    return await axios({
      url: `${baseURL}/pedidos`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  changeStatusPedido: async (id, status, token) => {
    return await axios({
      url: `${baseURL}/pedidos`,
      method: 'PUT',
      data: { id, status },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },
  deltePedido: async (id, token) => {
    return await axios({
      url: `${baseURL}/pedidos`,
      method: 'DELETE',
      data: { id },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }
}
