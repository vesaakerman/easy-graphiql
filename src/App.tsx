/*
 * Copyright (C) 2018 DANS - Data Archiving and Networked Services (info@dans.knaw.nl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react"
import { Component, createRef, SyntheticEvent } from "react"
import GraphiQL from "graphiql"
import GraphiQLExplorer from "graphiql-explorer"
import "graphiql/graphiql.css"
import "./App.css"
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from "graphql"

interface AppState {
    schema?: GraphQLSchema
    query?: string
    variables?: string
    operationName?: string
    explorerIsOpen: boolean

    backendURL: string
    username: string
    password: string
}

class App extends Component<{}, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            schema: null,
            query: undefined,
            variables: undefined,
            operationName: undefined,
            explorerIsOpen: true,
            backendURL: "https://deasy.dans.knaw.nl/deposit-properties/graphql",
            username: "",
            password: "",
        }
    }

    _graphiql = createRef<GraphiQL>()

    graphQLFetcher = async (graphQLParams) => {
        const username = this.state.username
        const password = this.state.password
        const encoded = window.btoa(`${username}:${password}`)
        const auth = "Basic " + encoded

        const response = await fetch(this.state.backendURL, {
            method: "post",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": auth,
            },
            body: JSON.stringify(graphQLParams),
            credentials: "include",
        })
        const responseBody = await response.text()

        try {
            return JSON.parse(responseBody)
        }
        catch (error) {
            return responseBody
        }
    }

    toggleExplorer = () => {
        this.setState(state => ({ ...state, explorerIsOpen: !state.explorerIsOpen }))
    }

    setQuery = newQuery => {
        this.setState(state => ({ ...state, query: newQuery }))
    }

    setVariable = newVariables => {
        this.setState(state => ({ ...state, variables: newVariables }))
    }

    setNewOperationName = newOperationName => {
        this.setState(state => ({ ...state, operationName: newOperationName }))
    }

    setUsername = e => {
        e.persist()
        this.setState(state => ({ ...state, username: e.target.value }))
    }

    setPassword = e => {
        e.persist()
        this.setState(state => ({ ...state, password: e.target.value }))
    }

    setBackendURL = e => {
        e.persist()
        this.setState(state => ({ ...state, backendURL: e.target.value }))
    }

    async fetchSchema() {
        const result = await this.graphQLFetcher({ query: getIntrospectionQuery() })
        this.setState(state => ({ ...state, schema: buildClientSchema(result.data) }))
    }

    async componentDidMount() {
        await this.fetchSchema()
    }

    async componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<AppState>, snapshot?: any) {
        if (prevState.backendURL !== this.state.backendURL) {
            console.log("backendURL changed, fetching new schema")
            await this.fetchSchema()
        }
    }

    render() {
        return (
            <div id="graphiql">
                <div className="config">
                    <div>
                        <label htmlFor="username" className="title">Username</label>
                        <input type="text"
                               id="username"
                               placeholder="Username"
                               value={this.state.username}
                               onChange={this.setUsername}/>
                    </div>
                    <div>
                        <label htmlFor="password" className="title">Password</label>
                        <input type="password"
                               id="password"
                               placeholder="Password"
                               value={this.state.password}
                               onChange={this.setPassword}/>
                    </div>
                    <div>
                        <label htmlFor="backend_url" className="title">Server</label>
                        <input type="text"
                               id="backend_url"
                               placeholder="Backend URL"
                               value={this.state.backendURL}
                               onChange={this.setBackendURL}/>
                    </div>
                </div>
                <div className="graphiql-container">
                    <GraphiQLExplorer
                        schema={this.state.schema}
                        query={this.state.query}
                        onEdit={this.setQuery}
                        onRunOperation={() => this._graphiql.current.handleRunQuery()}
                        explorerIsOpen={this.state.explorerIsOpen}
                        onToggleExplorer={this.toggleExplorer}/>
                    <GraphiQL
                        ref={ref => (this._graphiql = ref)}
                        fetcher={this.graphQLFetcher}
                        schema={this.state.schema}
                        query={this.state.query}
                        variables={this.state.variables}
                        operationName={this.state.operationName}
                        onEditQuery={this.setQuery}
                        onEditVariables={this.setVariable}
                        onEditOperationName={this.setNewOperationName}>
                        <GraphiQL.Toolbar>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handlePrettifyQuery()}
                                label="Prettify"
                                title="Prettify Query (Shift-Ctrl-P)"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleMergeQuery()}
                                title="Merge Query (Shift-Ctrl-M)"
                                label="Merge"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleCopyQuery()}
                                title="Copy Query (Shift-Ctrl-C)"
                                label="Copy"/>
                            <GraphiQL.Button
                                onClick={() => this._graphiql.current.handleToggleHistory()}
                                label="History"
                                title="Show History"/>
                            <GraphiQL.Button
                                onClick={this.toggleExplorer}
                                label="Explorer"
                                title="Toggle Explorer"/>
                        </GraphiQL.Toolbar>
                    </GraphiQL>
                </div>
            </div>
        )
    }
}

export default App
